import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { streamChat, type ChatTurn } from '../lib/api'
import { NAME, TWIN_NAME } from '../data/site'

const SUGGESTIONS = [
  'What does Osher do at Cognizant?',
  'What has he built with generative AI?',
  'What is his cloud experience?',
]

// Mirror the backend's limits (backend/app/main.py, agent.py): the agent only
// reads the last 6 turns, and longer payloads are rejected with a 422.
const HISTORY_TURNS = 6
const MAX_MESSAGE_CHARS = 2000

export default function Chat() {
  const [open, setOpen] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => () => abortRef.current?.abort(), [])

  // Draws attention to the chat button on every page load — dismissed by
  // opening the chat, closing the bubble explicitly, or after a while.
  useEffect(() => {
    const showTimer = setTimeout(() => setHintVisible(true), 1500)
    const hideTimer = setTimeout(() => setHintVisible(false), 10_000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    if (open) setHintVisible(false)
  }, [open])

  async function send(text: string) {
    const question = text.trim()
    if (!question || streaming) return

    const history = messages
    setMessages([...history, { role: 'user', content: question }, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat(
        question,
        history.slice(-HISTORY_TURNS),
        (delta) =>
          setMessages((current) => {
            const next = [...current]
            next[next.length - 1] = {
              role: 'assistant',
              content: next[next.length - 1].content + delta,
            }
            return next
          }),
        controller.signal,
      )
    } catch {
      setMessages((current) => {
        const next = [...current]
        next[next.length - 1] = {
          role: 'assistant',
          content: `Sorry — ${TWIN_NAME} is resting right now. Please try again in a bit.`,
        }
        return next
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  return (
    <>
      <AnimatePresence>
        {hintVisible && !open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed right-5 bottom-24 z-50 flex max-w-[15rem] items-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-xl dark:border-white/10 dark:bg-[#14141d]"
          >
            <p className="text-slate-700 dark:text-slate-200">
              <span className="font-mono text-accent dark:text-accent-soft">$</span> Hey — talk to
              me, I'm {TWIN_NAME}
            </p>
            <button
              type="button"
              onClick={() => setHintVisible(false)}
              aria-label="Dismiss"
              className="shrink-0 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : `Chat with ${TWIN_NAME}`}
        className="fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent text-xl text-white shadow-lg shadow-accent/30 transition-transform hover:scale-105"
      >
        {open ? '✕' : '✦'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed right-5 bottom-24 z-50 flex h-[min(32rem,70vh)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#14141d]"
          >
            <header className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <p className="font-medium text-slate-900 dark:text-slate-100">{TWIN_NAME}</p>
              <p className="text-xs text-slate-500">Ask me anything about {NAME.split(' ')[0]}</p>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-slate-500">Try asking:</p>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition-colors hover:border-accent hover:text-accent dark:border-white/10 dark:hover:border-accent-soft dark:hover:text-accent-soft"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message, i) => (
                <div
                  key={i}
                  className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-accent text-white'
                        : 'bg-slate-100 dark:bg-white/[0.06]'
                    }`}
                  >
                    {message.content}
                    {message.role === 'assistant' &&
                      streaming &&
                      i === messages.length - 1 && (
                        <span className="animate-caret ml-0.5" aria-hidden="true">
                          ▍
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-white/10"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_MESSAGE_CHARS}
                placeholder="Ask a question…"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:focus:border-accent-soft"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="rounded-xl bg-accent px-3.5 py-2 text-sm text-white transition-opacity disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
