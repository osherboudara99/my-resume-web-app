import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchGithubStats, fetchRepos, type GithubStats, type Repo } from './api'

// Measured locally: a cache hit on the backend resolves in ~2ms, a cache miss
// (GitHub API cold, one call per repo for languages) takes ~5-6s, and Cloud
// Run's scale-to-zero can add a cold start on top of that. The cap has to
// clear that worst case rather than the common one.
const READY_TIMEOUT_MS = 7000

interface GithubData {
  streak: number | null
  streakError: boolean
  repos: Repo[] | null
  reposError: boolean
  ready: boolean
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

  const ready = (streakSettled && reposSettled) || timedOut

  return (
    <GithubDataContext.Provider value={{ streak, streakError, repos, reposError, ready }}>
      {children}
    </GithubDataContext.Provider>
  )
}

export function useGithubData(): GithubData {
  const ctx = useContext(GithubDataContext)
  if (!ctx) throw new Error('useGithubData must be used within a GithubDataProvider')
  return ctx
}
