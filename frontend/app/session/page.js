'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Brain, Send, ArrowLeft, Loader2, StopCircle } from 'lucide-react'

export default function SessionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const repoUrl = searchParams.get('repo')
  const bottomRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(true)
  const [ending, setEnding] = useState(false)
  const [repoSummary, setRepoSummary] = useState(null)
  const [companyMode, setCompanyMode] = useState('generic')

  const startInterview = async () => {
    setStarting(true)
    try {
      const res = await fetch('http://localhost:8000/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl, company_mode: companyMode })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to load repository')
      }
      const data = await res.json()
      setRepoSummary(data.repo_summary)
      setMessages([{ role: 'assistant', content: data.question }])
    } catch (err) {
      setMessages([{ role: 'assistant', content: err.message || 'Failed to load repository. Please check the URL and try again.' }])
    }
    setStarting(false)
  }

  useEffect(() => {
    if (repoUrl) startInterview()
  }, [repoUrl])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return
    const newMessages = [...messages, { role: 'user', content: userInput }]
    setMessages(newMessages)
    setUserInput('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/interview/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          conversation_history: newMessages,
          company_mode: companyMode
        })
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.question }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const endInterview = async () => {
    setEnding(true)
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    let score = 0
    const feedbacks = []

    for (let i = 0; i < userMessages.length; i++) {
      try {
        const res = await fetch('http://localhost:8000/interview/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: assistantMessages[i]?.content || '',
            answer: userMessages[i]?.content || '',
            repo_url: repoUrl
          })
        })
        const data = await res.json()
        if (data.confident) score++
        feedbacks.push({
          question: assistantMessages[i]?.content || '',
          answer: userMessages[i]?.content || '',
          feedback: data.feedback,
          confident: data.confident
        })
      } catch (err) {
        console.error('Evaluation error:', err)
      }
    }

    const total = userMessages.length
    // Store in sessionStorage instead of URL to avoid length issues
    sessionStorage.setItem('retrace_feedback', JSON.stringify(feedbacks))
    sessionStorage.setItem('retrace_score', score)
    sessionStorage.setItem('retrace_total', total)
    sessionStorage.setItem('retrace_repo', repoUrl)
    router.push('/results')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <span className="font-semibold">Retrace</span>
          </div>
          {repoUrl && (
            <span className="text-zinc-500 text-sm hidden md:block">
              {repoUrl.replace('https://github.com/', '')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={endInterview}
            disabled={ending || starting}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg px-3 py-2 text-sm text-zinc-300"
          >
            <StopCircle className="w-4 h-4 text-red-400" />
            {ending ? 'Evaluating...' : 'End Interview'}
          </button>

          <select
            value={companyMode}
            onChange={(e) => setCompanyMode(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="generic">Generic Senior Engineer</option>
            <option value="meta">Meta Interview</option>
            <option value="google">Google Interview</option>
            <option value="startup">Startup CTO</option>
          </select>
        </div>
      </div>

      {/* Repo Summary Bar */}
      {repoSummary && (
        <div className="border-b border-zinc-800 px-6 py-3 flex items-center gap-6 text-sm text-zinc-400 bg-zinc-950">
          <span>📁 {repoSummary.file_count} files</span>
          {repoSummary.dependencies?.npm?.length > 0 && (
            <span>📦 {repoSummary.dependencies.npm.length} npm packages</span>
          )}
          {repoSummary.dependencies?.pip?.length > 0 && (
            <span>🐍 {repoSummary.dependencies.pip.length} pip packages</span>
          )}
          <span>📝 {repoSummary.commits?.length} recent commits</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {starting ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-zinc-400">Analyzing your repository...</p>
              <p className="text-zinc-600 text-sm">This may take up to 30 seconds</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain className="w-4 h-4" />
                  </div>
                )}
                <div className={`max-w-2xl rounded-2xl px-5 py-4 ${
                  msg.role === 'assistant'
                    ? 'bg-zinc-900 border border-zinc-800 text-white'
                    : 'bg-violet-600 text-white'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            placeholder="Type your answer..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading || starting}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || starting || !userInput.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl px-4 py-3"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}