import { type ReactNode } from 'react'

type PageContainerWidth = 'default' | 'wide' | 'full'

interface PageContainerProps {
  children: ReactNode
  className?: string
  width?: PageContainerWidth
}

const widthClass: Record<PageContainerWidth, string> = {
  default: 'max-w-6xl lg:max-w-[78rem]',
  wide: 'max-w-7xl lg:max-w-[90rem]',
  full: 'max-w-none',
}

export function PageContainer({
  children,
  className = '',
  width = 'default',
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${widthClass[width]} px-4 py-10 sm:px-6 lg:mx-0 lg:px-8 ${className}`}
    >
      {children}
    </div>
  )
}
