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

interface FormattedLessonContentProps {
  content: string
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
  const match = /^-\s+(.+)$/.exec(line)

  return match ? match[1] : null
}

function getOrderedListItem(line: string): string | null {
  const match = /^\d+\.\s+(.+)$/.exec(line)

  return match ? match[1] : null
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
        getOrderedListItem(currentLine) !== null
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

function renderInline(text: string, keyPrefix: string): ReactNode[] {
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
          className="rounded-md border border-slate-800 bg-slate-950 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-200"
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

function renderHeading(block: Extract<ContentBlock, { type: 'heading' }>) {
  const className = {
    1: 'text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl',
    2: 'text-xl font-semibold leading-tight text-slate-100 sm:text-2xl',
    3: 'text-lg font-semibold leading-tight text-slate-100',
  }[block.level]

  if (block.level === 1) {
    return <h1 className={className}>{renderInline(block.text, 'heading-1')}</h1>
  }

  if (block.level === 2) {
    return <h2 className={className}>{renderInline(block.text, 'heading-2')}</h2>
  }

  return <h3 className={className}>{renderInline(block.text, 'heading-3')}</h3>
}

export function FormattedLessonContent({
  content,
}: FormattedLessonContentProps) {
  const blocks = parseBlocks(content)

  return (
    <div className="space-y-5 break-words text-base leading-8 text-slate-300">
      {blocks.map((block, index) => {
        const blockKey = `${block.type}-${index}`

        if (block.type === 'heading') {
          return <div key={blockKey}>{renderHeading(block)}</div>
        }

        if (block.type === 'paragraph') {
          return (
            <p key={blockKey}>{renderInline(block.text, `${blockKey}-inline`)}</p>
          )
        }

        if (block.type === 'unordered-list') {
          return (
            <ul
              key={blockKey}
              className="list-disc space-y-2 pl-6 marker:text-cyan-300"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${blockKey}-${itemIndex}`}>
                  {renderInline(item, `${blockKey}-${itemIndex}-inline`)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ordered-list') {
          return (
            <ol
              key={blockKey}
              className="list-decimal space-y-2 pl-6 marker:text-cyan-300"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${blockKey}-${itemIndex}`}>
                  {renderInline(item, `${blockKey}-${itemIndex}-inline`)}
                </li>
              ))}
            </ol>
          )
        }

        return (
          <div
            key={blockKey}
            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
          >
            {block.language ? (
              <div className="border-b border-slate-800 px-4 py-2 text-xs font-medium uppercase tracking-wide text-cyan-300">
                {block.language}
              </div>
            ) : null}
            <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-200">
              <code>{block.code}</code>
            </pre>
          </div>
        )
      })}
    </div>
  )
}
