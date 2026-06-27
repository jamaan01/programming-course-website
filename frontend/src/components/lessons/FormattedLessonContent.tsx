import { type ReactNode } from 'react'

type ContentBlock =
  | {
      type: 'heading'
      level: 1 | 2 | 3
      text: string
    }
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'unordered-list'
      items: string[]
    }
  | {
      type: 'ordered-list'
      items: string[]
    }
  | {
      type: 'code'
      code: string
      language: string | null
    }
  | {
      type: 'table'
      headers: string[]
      rows: string[][]
    }

interface FormattedLessonContentProps {
  content: string
  compact?: boolean
}

function getHeading(line: string): ContentBlock | null {
  const match = /^(#{1,3})\s+(.+)$/.exec(line)

  if (!match) {
    return null
  }

  return {
    type: 'heading',
    level: match[1].length as 1 | 2 | 3,
    text: match[2].trim(),
  }
}

function getCodeFenceLanguage(line: string): string | null {
  const match = /^```([A-Za-z0-9_+#.-]*)\s*$/.exec(line.trim())

  if (!match) {
    return null
  }

  return match[1] ? match[1] : ''
}

function getUnorderedListItem(line: string): string | null {
  const match = /^[-*]\s+(.+)$/.exec(line)

  return match ? match[1] : null
}

function getOrderedListItem(line: string): string | null {
  const match = /^\d+\.\s+(.+)$/.exec(line)

  return match ? match[1] : null
}

function splitTableRow(line: string): string[] {
  const trimmedLine = line.trim()
  let cells = trimmedLine.split('|')

  if (trimmedLine.startsWith('|')) {
    cells = cells.slice(1)
  }

  if (trimmedLine.endsWith('|')) {
    cells = cells.slice(0, -1)
  }

  return cells.map((cell) => cell.trim())
}

function isTableRow(line: string): boolean {
  const trimmedLine = line.trim()

  if (!trimmedLine.includes('|')) {
    return false
  }

  return splitTableRow(trimmedLine).length >= 2
}

function isTableSeparatorRow(line: string): boolean {
  if (!isTableRow(line)) {
    return false
  }

  const cells = splitTableRow(line)
  const separatorPattern = /^:?-{3,}:?$/

  return (
    cells.length >= 2 &&
    cells.every((cell) => separatorPattern.test(cell.trim()))
  )
}

function isTableStart(lines: string[], index: number): boolean {
  return (
    index + 1 < lines.length &&
    isTableRow(lines[index]) &&
    isTableSeparatorRow(lines[index + 1])
  )
}

function normalizeTableRow(cells: string[], columnCount: number): string[] {
  if (cells.length < columnCount) {
    return [...cells, ...Array(columnCount - cells.length).fill('')]
  }

  return cells.slice(0, columnCount)
}

function parseBlocks(content: string): ContentBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ContentBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      index += 1
      continue
    }

    const fenceLanguage = getCodeFenceLanguage(line)

    if (fenceLanguage !== null) {
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      blocks.push({
        type: 'code',
        code: codeLines.join('\n'),
        language: fenceLanguage || null,
      })
      continue
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(line)
      const columnCount = headers.length
      const rows: string[][] = []

      index += 2

      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(normalizeTableRow(splitTableRow(lines[index]), columnCount))
        index += 1
      }

      blocks.push({
        type: 'table',
        headers,
        rows,
      })
      continue
    }

    const heading = getHeading(line)

    if (heading) {
      blocks.push(heading)
      index += 1
      continue
    }

    const unorderedItem = getUnorderedListItem(line)

    if (unorderedItem !== null) {
      const items: string[] = []

      while (index < lines.length) {
        const item = getUnorderedListItem(lines[index])

        if (item === null) {
          break
        }

        items.push(item)
        index += 1
      }

      blocks.push({
        type: 'unordered-list',
        items,
      })
      continue
    }

    const orderedItem = getOrderedListItem(line)

    if (orderedItem !== null) {
      const items: string[] = []

      while (index < lines.length) {
        const item = getOrderedListItem(lines[index])

        if (item === null) {
          break
        }

        items.push(item)
        index += 1
      }

      blocks.push({
        type: 'ordered-list',
        items,
      })
      continue
    }

    const paragraphLines: string[] = []

    while (index < lines.length) {
      const currentLine = lines[index]
      const currentTrimmedLine = currentLine.trim()

      if (
        !currentTrimmedLine ||
        getCodeFenceLanguage(currentLine) !== null ||
        getHeading(currentLine) ||
        getUnorderedListItem(currentLine) !== null ||
        getOrderedListItem(currentLine) !== null ||
        isTableStart(lines, index)
      ) {
        break
      }

      paragraphLines.push(currentTrimmedLine)
      index += 1
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join('\n'),
    })
  }

  return blocks
}

function isSafeLinkUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
  } catch {
    return false
  }
}

function renderTextWithLineBreaks(text: string, keyPrefix: string): ReactNode[] {
  return text.split('\n').flatMap((line, index, lines) => {
    const nodeKey = `${keyPrefix}-text-${index}`
    const lineNode = <span key={nodeKey}>{line}</span>

    if (index === lines.length - 1) {
      return [lineNode]
    }

    return [lineNode, <br key={`${nodeKey}-br`} />]
  })
}

function renderInline(
  text: string,
  keyPrefix: string,
  compact = false,
): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        ...renderTextWithLineBreaks(
          text.slice(lastIndex, match.index),
          `${keyPrefix}-${nodes.length}`,
        ),
      )
    }

    const token = match[0]
    const nodeKey = `${keyPrefix}-${nodes.length}`

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={nodeKey} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={nodeKey}
          className={
            compact
              ? 'rounded border border-slate-800 bg-slate-950 px-1 py-0.5 font-mono text-[0.9em] text-cyan-200'
              : 'rounded-md border border-slate-800 bg-slate-950 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-200'
          }
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)

      if (linkMatch && isSafeLinkUrl(linkMatch[2])) {
        nodes.push(
          <a
            key={nodeKey}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="font-medium text-sky-300 underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {linkMatch[1]}
          </a>,
        )
      } else {
        nodes.push(...renderTextWithLineBreaks(token, nodeKey))
      }
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(
      ...renderTextWithLineBreaks(
        text.slice(lastIndex),
        `${keyPrefix}-${nodes.length}`,
      ),
    )
  }

  return nodes
}

function renderHeading(
  block: Extract<ContentBlock, { type: 'heading' }>,
  compact = false,
) {
  const className = compact
    ? {
        1: 'text-base font-semibold leading-6 text-slate-100',
        2: 'text-sm font-semibold leading-6 text-slate-100',
        3: 'text-sm font-semibold leading-6 text-slate-100',
      }[block.level]
    : {
        1: 'text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl',
        2: 'text-xl font-semibold leading-tight text-slate-100 sm:text-2xl',
        3: 'text-lg font-semibold leading-tight text-slate-100',
      }[block.level]

  if (block.level === 1) {
    return (
      <h1 className={className}>
        {renderInline(block.text, 'heading-1', compact)}
      </h1>
    )
  }

  if (block.level === 2) {
    return (
      <h2 className={className}>
        {renderInline(block.text, 'heading-2', compact)}
      </h2>
    )
  }

  return (
    <h3 className={className}>
      {renderInline(block.text, 'heading-3', compact)}
    </h3>
  )
}

export function FormattedMarkdownText({
  content,
  compact = false,
}: FormattedLessonContentProps) {
  const blocks = parseBlocks(content)
  const containerClass = compact
    ? 'space-y-2 break-words text-sm leading-6 text-slate-300'
    : 'space-y-5 break-words text-base leading-8 text-slate-300'
  const listClass = compact
    ? 'list-disc space-y-1 pl-5 marker:text-cyan-300'
    : 'list-disc space-y-2 pl-6 marker:text-cyan-300'
  const orderedListClass = compact
    ? 'list-decimal space-y-1 pl-5 marker:text-cyan-300'
    : 'list-decimal space-y-2 pl-6 marker:text-cyan-300'
  const codeWrapperClass = compact
    ? 'overflow-hidden rounded-lg border border-slate-800 bg-slate-950'
    : 'overflow-hidden rounded-xl border border-slate-800 bg-slate-950'
  const codeLabelClass = compact
    ? 'border-b border-slate-800 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-cyan-300'
    : 'border-b border-slate-800 px-4 py-2 text-xs font-medium uppercase tracking-wide text-cyan-300'
  const preClass = compact
    ? 'overflow-x-auto p-3 text-xs leading-5 text-slate-200'
    : 'overflow-x-auto p-4 text-sm leading-6 text-slate-200'
  const tableWrapperClass = compact
    ? 'overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60'
    : 'overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70'
  const tableClass = compact
    ? 'min-w-full border-collapse text-left text-xs'
    : 'min-w-full border-collapse text-left text-sm'
  const tableHeadClass = 'bg-slate-900/80'
  const tableHeaderCellClass = compact
    ? 'border-b border-slate-800 px-2 py-1.5 font-semibold text-slate-100'
    : 'border-b border-slate-800 px-4 py-3 font-semibold text-slate-100'
  const tableCellClass = compact
    ? 'border-t border-slate-800 px-2 py-1.5 align-top text-slate-300'
    : 'border-t border-slate-800 px-4 py-3 align-top text-slate-300'

  return (
    <div className={containerClass}>
      {blocks.map((block, index) => {
        const blockKey = `${block.type}-${index}`

        if (block.type === 'heading') {
          return <div key={blockKey}>{renderHeading(block, compact)}</div>
        }

        if (block.type === 'paragraph') {
          return (
            <p key={blockKey}>
              {renderInline(block.text, `${blockKey}-inline`, compact)}
            </p>
          )
        }

        if (block.type === 'unordered-list') {
          return (
            <ul
              key={blockKey}
              className={listClass}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${blockKey}-${itemIndex}`}>
                  {renderInline(item, `${blockKey}-${itemIndex}-inline`, compact)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ordered-list') {
          return (
            <ol
              key={blockKey}
              className={orderedListClass}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${blockKey}-${itemIndex}`}>
                  {renderInline(item, `${blockKey}-${itemIndex}-inline`, compact)}
                </li>
              ))}
            </ol>
          )
        }

        if (block.type === 'table') {
          return (
            <div key={blockKey} className={tableWrapperClass}>
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={`${blockKey}-header-${headerIndex}`}
                        className={tableHeaderCellClass}
                      >
                        <span className="break-words">
                          {renderInline(
                            header,
                            `${blockKey}-header-${headerIndex}-inline`,
                            compact,
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${blockKey}-row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${blockKey}-row-${rowIndex}-cell-${cellIndex}`}
                          className={tableCellClass}
                        >
                          <span className="break-words">
                            {renderInline(
                              cell,
                              `${blockKey}-row-${rowIndex}-cell-${cellIndex}-inline`,
                              compact,
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <div
            key={blockKey}
            className={codeWrapperClass}
          >
            {block.language ? (
              <div className={codeLabelClass}>
                {block.language}
              </div>
            ) : null}
            <pre className={preClass}>
              <code>{block.code}</code>
            </pre>
          </div>
        )
      })}
    </div>
  )
}

export function FormattedLessonContent({
  content,
}: FormattedLessonContentProps) {
  return <FormattedMarkdownText content={content} />
}
