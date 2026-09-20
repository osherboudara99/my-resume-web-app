import { useEffect, useState } from 'react'
import { useGithubData } from '../lib/githubData'
import { getLiveMusicPlays } from '../lib/musicStats'
import useCountUp from '../lib/useCountUp'
import TerminalWindow from './TerminalWindow'

function StatCard({
  title,
  value,
  suffix,
  loading,
}: {
  title: string
  value: number
  suffix?: string
  loading?: boolean
}) {
  const display = useCountUp(loading ? 0 : value)
  return (
    <TerminalWindow title={title}>
      {loading ? (
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
      ) : (
        <p className="font-mono text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {display.toLocaleString()}
          {suffix && <span className="ml-1.5 text-lg text-slate-500 dark:text-slate-400">{suffix}</span>}
        </p>
      )}
    </TerminalWindow>
  )
}

export default function Stats() {
  const { streak } = useGithubData()
  const [musicPlays, setMusicPlays] = useState(() => getLiveMusicPlays())

  // Ticks the music stat forward at random moments while the tab is open,
  // matching the same "one at a time throughout the day" drift as the
  // underlying getLiveMusicPlays computation.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleNext = () => {
      const delay = 20_000 + Math.random() * 40_000
      timer = setTimeout(() => {
        setMusicPlays(getLiveMusicPlays())
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [])

  // Renders bare -- no section chrome or heading. This is embedded as a small
  // block inside the About section rather than standing on its own, so the
  // terminal card titles carry the labelling.
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        title="git contributions --streak --all-accounts"
        value={streak ?? 0}
        suffix="day streak"
        loading={streak === null}
      />
      <StatCard
        title="applemusic.app --lifetime-play-count"
        value={musicPlays}
        suffix="songs played"
      />
    </div>
  )
}
