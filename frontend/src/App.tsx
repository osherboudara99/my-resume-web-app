import Nav from './components/Nav'
import Hero from './components/Hero'
import Projects from './components/Projects'
import Resume from './components/Resume'
import Certifications from './components/Certifications'
import Chat from './components/Chat'
import SplashScreen from './components/SplashScreen'
import { GithubDataProvider } from './lib/githubData'
import { NAME } from './data/site'

export default function App() {
  return (
    <GithubDataProvider>
      <SplashScreen />

      <div id="top" className="min-h-svh">
        <Nav />

        <main className="mx-auto max-w-5xl px-6">
          <Hero />
          <Projects />
          <Resume />
          <Certifications />
        </main>

        <Chat />

        <footer className="border-t border-slate-200 py-10 text-center text-sm dark:border-white/10">
          <p>
            © {new Date().getFullYear()} {NAME}
          </p>
        </footer>
      </div>
    </GithubDataProvider>
  )
}
