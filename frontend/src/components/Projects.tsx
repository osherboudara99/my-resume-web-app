import { useEffect, useMemo, useState } from 'react'
import { fetchRepos, type Repo } from '../lib/api'
import Section from './Section'

type SortKey = 'updated_at' | 'created_at' | 'name'

const SORT_LABELS: Record<SortKey, string> = {
  updated_at: 'Last updated',
  created_at: 'Created',
  name: 'Name',
}

export default function Projects() {
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [error, setError] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [descending, setDescending] = useState(true)

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch(() => setError(true))
  }, [])

  const sorted = useMemo(() => {
    if (!repos) return []
    const copy = [...repos]
    copy.sort((a, b) =>
      sortKey === 'name'
        ? a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        : Date.parse(a[sortKey]) - Date.parse(b[sortKey]),
    )
    return descending ? copy.reverse() : copy
  }, [repos, sortKey, descending])

  return (
    <Section
      id="projects"
      title="Projects"
      subtitle="Pulled live from GitHub."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor="repo-sort" className="text-slate-500 dark:text-slate-400">
          Sort by
        </label>
        <select
          id="repo-sort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-slate-900 dark:border-white/10 dark:text-slate-100"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key} className="dark:bg-[#14141d]">
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setDescending((d) => !d)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 transition-colors hover:border-accent hover:text-accent dark:border-white/10 dark:hover:border-accent-soft dark:hover:text-accent-soft"
        >
          {descending ? 'Descending ↓' : 'Ascending ↑'}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          Projects couldn’t be retrieved right now. Please try again later.
        </p>
      )}

      {!repos && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((repo) => (
          <div
            key={repo.name}
            className="group relative flex flex-col rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5 dark:border-white/10 dark:hover:border-accent-soft/60 dark:hover:shadow-black/20"
          >
            <h3 className="font-medium tracking-tight group-hover:text-accent dark:group-hover:text-accent-soft">
              <a href={repo.html_url} target="_blank" rel="noreferrer" className="after:absolute after:inset-0">
                {repo.name}
              </a>
            </h3>
            <p className="mt-2 flex-1 text-sm">{repo.description || 'No description'}</p>

            {repo.language.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {repo.language.map((lang) => (
                  <li
                    key={lang}
                    className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent dark:text-accent-soft"
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-500">
              <span>Updated {repo.updated_relative}</span>
              {(repo.stargazers_count > 0 || repo.forks_count > 0) && (
                <span>
                  ★ {repo.stargazers_count} · ⑂ {repo.forks_count}
                </span>
              )}
            </div>

            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noreferrer"
                className="relative z-10 mt-3 inline-flex w-fit items-center gap-1 text-xs text-accent hover:underline dark:text-accent-soft"
              >
                Visit site ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}
