import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  id: string
  title: string
  subtitle?: ReactNode
  children: ReactNode
}

export default function Section({ id, title, subtitle, children }: Props) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="scroll-mt-20 border-t border-slate-200 py-20 dark:border-white/10"
    >
      <h2 className="text-3xl font-semibold tracking-tight">
        <span className="mr-2 font-mono text-accent dark:text-accent-soft" aria-hidden="true">
          //
        </span>
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-[15px]">{subtitle}</p>}
      <div className="mt-10">{children}</div>
    </motion.section>
  )
}
