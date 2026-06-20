'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, Target, Zap, Shield } from 'lucide-react'

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const router = useRouter()

  const handleStart = () => {
    if (repoUrl.trim()) {
      router.push(`/session?repo=${encodeURIComponent(repoUrl)}`)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-400" />
          <span className="text-xl font-bold">Retrace</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
  <a href="https://github.com" className="text-zinc-400 hover:text-white transition-colors text-sm">
    GitHub
  </a>
  <button
    onClick={() => router.push('/login')}
    className="bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg px-4 py-2 text-sm font-semibold"
  >
    Sign in
  </button>
</div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 text-violet-400 text-sm mb-8">
          <Zap className="w-3 h-3" />
          AI-powered technical interview simulator
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Can you explain
          <br />
          <span className="text-violet-400">your own code?</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          Retrace reads your GitHub repositories and simulates a brutal, honest technical interview 
          based on the code you actually wrote. No generic questions. Just your code, under pressure.
        </p>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mb-6">
          <input
            type="text"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            onClick={handleStart}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg px-6 py-3 font-semibold whitespace-nowrap"
          >
            Start Interview
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-zinc-600 text-sm">Free. No account required to try.</p>
      </section>

      {/* Features */}
      <section className="px-8 py-24 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Target className="w-8 h-8 text-violet-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your code, not LeetCode</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Every question is generated from your actual repository — your architecture, your decisions, your trade-offs.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Brain className="w-8 h-8 text-violet-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Remembers everything</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Retrace tracks what you struggle to explain and resurfaces those concepts at exactly the right moment.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Shield className="w-8 h-8 text-violet-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Company mode</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Switch interview style to match Meta, Google, startup CTO, or a generic senior engineer panel.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 py-24 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-zinc-400 text-center mb-12">Three steps. No setup. No accounts required to try.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4 text-violet-400 font-bold">1</div>
              <h3 className="font-semibold mb-2">Paste your repo</h3>
              <p className="text-zinc-400 text-sm">Drop in any public GitHub repository URL. Works best on projects you've personally written or contributed to.</p>
            </div>  
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4 text-violet-400 font-bold">2</div>
              <h3 className="font-semibold mb-2">Get interrogated</h3>
              <p className="text-zinc-400 text-sm">The AI reads your code and asks specific, pointed questions about decisions you actually made.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4 text-violet-400 font-bold">3</div>
              <h3 className="font-semibold mb-2">See your blind spots</h3>
              <p className="text-zinc-400 text-sm">Get an honest score and a weakness map showing exactly what you can't yet explain confidently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-8 py-16 border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-semibold mb-3">What happens to your code</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Retrace temporarily clones your public repository to read its file structure, dependencies, and commit history. 
            This is used only to generate interview questions and is deleted from our server immediately after each session ends. 
            We do not permanently store your source code. Only your conversation text and scores are saved to your account, 
            so you can track progress over time.
          </p>
          <p className="text-zinc-500 text-xs">
            Retrace only works with public repositories. Never paste proprietary or confidential code you don't have permission to share.
          </p>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="border-t border-zinc-800 px-8 py-8 text-center text-zinc-600 text-sm">
  <p>Built by <a href="https://www.linkedin.com/in/ritika-lund" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-violet-400 transition-colors">Ritika Lund</a></p>
</footer>
    </main>
  )
}