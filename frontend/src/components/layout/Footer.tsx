import { Link } from 'react-router-dom'

const footerLinks = [
  {
    label: '+380 97 622 00 89',
    href: 'tel:+380976220089',
  },
  {
    label: 'goschoolgolab@gmail.com',
    href: 'mailto:goschoolgolab@gmail.com',
  },
  {
    label: 'Telegram',
    href: 'https://t.me/golab_ua',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/golab.ua?igsh=ZHlkeTBpaGFhZ3hq',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@GOLAB_ua',
  },
]

const legalLinks = [
  {
    label: 'Політика конфіденційності',
    href: '/privacy',
  },
  {
    label: 'Умови використання',
    href: '/terms',
  },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:mx-0 lg:max-w-[78rem] lg:px-8 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="font-medium text-slate-300">Контакти</p>
        </div>

        <div className="flex flex-col gap-2 xl:items-end">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
