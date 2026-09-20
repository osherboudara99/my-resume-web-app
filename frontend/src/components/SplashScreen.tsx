import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGithubData } from '../lib/githubData'
import TerminalWindow from './TerminalWindow'

// Paced for readability while someone's actually waiting on it, not for
// speed — each line gets a beat before the next appears.
const LINE_STAGGER_MS = 500
const GATE_SETTLE_PAUSE_MS = 400
// Safety floor so a startlingly fast warm-cache load still lands for a beat
// instead of blinking past.
const MIN_DISPLAY_MS = 1800

const INTRO_LINES = ['$ ./boot.sh --profile=osher-boudara', '[ok] loading environment', '[ok] authenticating with github']
const OUTRO_LINE = '[ok] spinning up ai twin'

function GateLine({ pendingLabel, doneLabel, done }: { pendingLabel: string; doneLabel: string; done: boolean }) {
  return (
    <p className={done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
      {done ? doneLabel : pendingLabel}
      {!done && (
        <span className="animate-caret ml-0.5 text-accent" aria-hidden="true">
          |
        </span>
      )}
    </p>
  )
}

export default function SplashScreen() {
  const { streakSettled, reposSettled, timedOut } = useGithubData()
  const [reducedMotion, setReducedMotion] = useState(false)
  const [introShown, setIntroShown] = useState(0)
  const [gate1Revealed, setGate1Revealed] = useState(false)
  const [gate2Revealed, setGate2Revealed] = useState(false)
  const [outroRevealed, setOutroRevealed] = useState(false)
  const [readyRevealed, setReadyRevealed] = useState(false)
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const stagger = reducedMotion ? 0 : LINE_STAGGER_MS
  const gatePause = reducedMotion ? 0 : GATE_SETTLE_PAUSE_MS

  // Reveal the fixed intro lines one at a time, then hand off to the
  // GitHub-gated lines below.
  useEffect(() => {
    if (introShown >= INTRO_LINES.length) return
    const timer = setTimeout(() => setIntroShown((n) => n + 1), stagger)
    return () => clearTimeout(timer)
  }, [introShown, stagger])

  useEffect(() => {
    if (introShown >= INTRO_LINES.length) setGate1Revealed(true)
  }, [introShown])

  // Gate 1 tracks the real streak fetch; only advances once it has actually
  // settled (or the shared timeout gives up on it).
  const gate1Done = gate1Revealed && (streakSettled || timedOut)
  useEffect(() => {
    if (!gate1Done || gate2Revealed) return
    const timer = setTimeout(() => setGate2Revealed(true), gatePause)
    return () => clearTimeout(timer)
  }, [gate1Done, gate2Revealed, gatePause])

  // Gate 2 tracks the real repos fetch the same way.
  const gate2Done = gate2Revealed && (reposSettled || timedOut)
  useEffect(() => {
    if (!gate2Done || outroRevealed) return
    const timer = setTimeout(() => setOutroRevealed(true), gatePause)
    return () => clearTimeout(timer)
  }, [gate2Done, outroRevealed, gatePause])

  useEffect(() => {
    if (!outroRevealed || readyRevealed) return
    const timer = setTimeout(() => setReadyRevealed(true), stagger)
    return () => clearTimeout(timer)
  }, [outroRevealed, readyRevealed, stagger])

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), reducedMotion ? 0 : MIN_DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [reducedMotion])

  const done = readyRevealed && minElapsed

  useEffect(() => {
    if (done) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [done])

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
                {INTRO_LINES.slice(0, introShown).map((line, i) => (
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

                {gate1Revealed && (
                  <GateLine
                    pendingLabel="[..] pulling contribution graph"
                    doneLabel="[ok] pulling contribution graph"
                    done={gate1Done}
                  />
                )}

                {gate2Revealed && (
                  <GateLine
                    pendingLabel="[..] indexing repositories"
                    doneLabel="[ok] indexing repositories"
                    done={gate2Done}
                  />
                )}

                {outroRevealed && <p className="text-emerald-600 dark:text-emerald-400">{OUTRO_LINE}</p>}

                {readyRevealed && <p className="text-slate-900 dark:text-slate-100">ready.</p>}
              </div>
            </TerminalWindow>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
