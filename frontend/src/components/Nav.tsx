import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NAME, SECTIONS } from '../data/site'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || mobileOpen
          ? 'border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b12]/80'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="font-mono text-sm tracking-tight text-slate-900 dark:text-slate-100"
        >
          {NAME.toLowerCase().replace(' ', '.')}
          <span className="text-accent">()</span>
        </a>

        <ul className="hidden items-center gap-7 text-sm sm:flex">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-900 sm:hidden dark:text-slate-400 dark:hover:text-white"
        >
          <span className="relative block h-3.5 w-4.5" aria-hidden="true">
            <span
              className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-200 ${mobileOpen ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span
              className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-200 ${mobileOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200/80 text-sm sm:hidden dark:border-white/10"
          >
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="block px-6 py-3 font-mono text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <span className="mr-2 text-accent dark:text-accent-soft" aria-hidden="true">
                    #
                  </span>
                  {section.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  )
}
