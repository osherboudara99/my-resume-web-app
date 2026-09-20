import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchGithubStats, fetchRepos, type GithubStats, type Repo } from './api'

// Measured locally: a cache hit on the backend resolves in ~2ms, a cache miss
// (GitHub API cold, one call per repo for languages) takes ~5-6s, and Cloud
// Run's scale-to-zero can add a cold start on top of that. 10s gives that
// worst case a comfortable margin without leaving the cap open-ended.
const READY_TIMEOUT_MS = 10000

interface GithubData {
  streak: number | null
  streakError: boolean
  streakSettled: boolean
  repos: Repo[] | null
  reposError: boolean
  reposSettled: boolean
  // A settle wait past this point is abandoned rather than genuinely done —
  // callers that need to distinguish the two should check *Settled directly.
  timedOut: boolean
}

const GithubDataContext = createContext<GithubData | null>(null)

export function GithubDataProvider({ children }: { children: ReactNode }) {
  const [streak, setStreak] = useState<number | null>(null)
  const [streakError, setStreakError] = useState(false)
  const [streakSettled, setStreakSettled] = useState(false)
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [reposError, setReposError] = useState(false)
  const [reposSettled, setReposSettled] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    fetchGithubStats()
      .then((stats: GithubStats) => setStreak(stats.current_streak))
      .catch(() => setStreakError(true))
      .finally(() => setStreakSettled(true))

    fetchRepos()
      .then(setRepos)
      .catch(() => setReposError(true))
      .finally(() => setReposSettled(true))

    const timer = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <GithubDataContext.Provider
      value={{ streak, streakError, streakSettled, repos, reposError, reposSettled, timedOut }}
    >
      {children}
    </GithubDataContext.Provider>
  )
}

export function useGithubData(): GithubData {
  const ctx = useContext(GithubDataContext)
  if (!ctx) throw new Error('useGithubData must be used within a GithubDataProvider')
  return ctx
}
