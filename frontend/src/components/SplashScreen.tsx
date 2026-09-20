import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGithubData } from '../lib/githubData'
import TerminalWindow from './TerminalWindow'

// Long enough that the boot log always gets to play out and land for a
// beat, short enough that a slow (cold-cache) load doesn't feel padded on
// top of its own wait. A warm-cache load is near-instant server-side, so
// this floor is effectively the whole experience on that path.
const MIN_DISPLAY_MS = 1800
const LINE_STAGGER_MS = 180

const BOOT_LINES = [
  '$ ./boot.sh --profile=osher-boudara',
  '[ok] loading environment',
  '[ok] authenticating with github',
  '[ok] pulling contribution graph',
  '[ok] indexing repositories',
  '[ok] spinning up ai twin',
]

export default function SplashScreen() {
  const { ready } = useGithubData()
  const [linesShown, setLinesShown] = useState(0)
  const [minElapsed, setMinElapsed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setLinesShown(BOOT_LINES.length)
      return
    }
    if (linesShown >= BOOT_LINES.length) return
    const timer = setTimeout(() => setLinesShown((n) => n + 1), LINE_STAGGER_MS)
    return () => clearTimeout(timer)
  }, [linesShown, reducedMotion])

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), reducedMotion ? 0 : MIN_DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [reducedMotion])

  const done = ready && minElapsed

  useEffect(() => {
    if (done) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [done])

  const scriptedDone = linesShown >= BOOT_LINES.length

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white px-6 dark:bg-[#0b0b12]"
        >
          <div
            className="glow-accent pointer-events-none absolute inset-x-0 top-0 h-[32rem]"
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md">
            <TerminalWindow title="~/osher-boudara/boot.sh" bodyClassName="p-5 font-mono text-sm">
              <div className="space-y-1.5">
                {BOOT_LINES.slice(0, linesShown).map((line, i) => (
                  <p
                    key={i}
                    className={
                      line.startsWith('$')
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {line}
                  </p>
                ))}

                {scriptedDone && !ready && (
                  <p className="text-slate-500 dark:text-slate-400">
                    [..] finishing up
                    <span className="animate-caret ml-0.5 text-accent" aria-hidden="true">
                      |
                    </span>
                  </p>
                )}

                {scriptedDone && ready && (
                  <p className="text-slate-900 dark:text-slate-100">ready.</p>
                )}
              </div>
            </TerminalWindow>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
