import { useState } from 'react'
import { CERTIFICATIONS, SOCIALS } from '../data/site'
import Section from './Section'

export default function Certifications() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <Section
      id="certifications"
      title="Certifications"
      subtitle={
        <>
          A few of my certifications. For the full list, see my{' '}
          <a
            href={SOCIALS.linkedinCertifications}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-4 dark:text-accent-soft"
          >
            LinkedIn
          </a>
          .
        </>
      }
    >
      <ul className="space-y-3">
        {CERTIFICATIONS.map((cert) => {
          const isOpen = open === cert.file
          return (
            <li
              key={cert.file}
              className="overflow-hidden rounded-2xl border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5 dark:border-white/10 dark:hover:border-accent-soft/60 dark:hover:shadow-black/20"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : cert.file)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
              >
                <span>
                  <span className="block font-medium text-slate-900 dark:text-slate-100">
                    {cert.name}
                  </span>
                  <span className="mt-0.5 block text-sm">{cert.issuer}</span>
                </span>
                <span
                  className={`shrink-0 text-accent transition-transform dark:text-accent-soft ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 p-5 dark:border-white/10">
                  <object
                    data={cert.file}
                    type="application/pdf"
                    className="h-[70vh] w-full rounded-xl border border-slate-200 dark:border-white/10"
                  >
                    <p className="p-4 text-sm">
                      Your browser can’t display this PDF inline.{' '}
                      <a
                        href={cert.file}
                        className="text-accent underline dark:text-accent-soft"
                      >
                        Open it in a new tab
                      </a>
                      .
                    </p>
                  </object>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <a
                      href={cert.file}
                      download
                      className="rounded-lg border border-slate-200 px-3 py-1.5 transition-colors hover:border-accent hover:text-accent dark:border-white/10 dark:hover:border-accent-soft dark:hover:text-accent-soft"
                    >
                      Download
                    </a>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 transition-colors hover:border-accent hover:text-accent dark:border-white/10 dark:hover:border-accent-soft dark:hover:text-accent-soft"
                      >
                        View credential ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
