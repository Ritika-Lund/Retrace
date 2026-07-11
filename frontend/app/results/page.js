'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Brain, ArrowLeft, RotateCcw, TrendingUp, MessageSquare } from 'lucide-react'

export default function ResultsPage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [repoUrl, setRepoUrl] = useState('')
  const [feedbackList, setFeedbackList] = useState([])
  const [loaded, setLoaded] = useState(false)
  const hasSaved = useRef(false)

  useEffect(() => {
    const s = parseInt(sessionStorage.getItem('retrace_score') || '0')
    const t = parseInt(sessionStorage.getItem('retrace_total') || '0')
    const r = sessionStorage.getItem('retrace_repo') || ''
    const f = JSON.parse(sessionStorage.getItem('retrace_feedback') || '[]')
    setScore(s)
    setTotal(t)
    setRepoUrl(r)
    setFeedbackList(f)
    setLoaded(true)

    if (!r) {
  router.push('/dashboard')
  return
}

    const saveSession = async () => {
      
      if (hasSaved.current) return
      hasSaved.current = true

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const accessToken = session.access_token

      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/save-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            repo_url: r,
            score: s,
            total: t,
            feedback: f
          })
        })
      } catch (err) {
        console.error('Failed to save session:', err)
      }
    }
    saveSession()
  }, [])

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  const getScoreColor = () => {
    if (percentage >= 70) return 'text-green-400'
    if (percentage >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreMessage = () => {
  if (percentage >= 85) return "You actually know what you built. This is not as common as it should be."
  if (percentage >= 70) return "You'd pass the interview. Your palms would sweat, but you'd pass."
  if (percentage >= 40) return "The code works. Your understanding of it is still loading."
  return "You and your code are strangers who happen to live in the same repository."
}

  const getScoreEmoji = () => {
    if (percentage >= 70) return '🔥'
    if (percentage >= 40) return '⚡'
    return '💀'
  }

  const getCardBorder = (score) => {
    if (score === 3) return 'border-green-500/30'
    if (score === 2) return 'border-blue-500/30'
    if (score === 1) return 'border-yellow-500/30'
    return 'border-red-500/30'
  }

  const getScoreBadge = (score) => {
    if (score === 3) return 'bg-green-500/20 border border-green-500/40 text-green-400'
    if (score === 2) return 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
    if (score === 1) return 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-400'
    return 'bg-red-500/20 border border-red-500/40 text-red-400'
  }

  const getFeedbackColor = (score) => {
    if (score >= 2) return 'text-green-400'
    return 'text-red-400'
  }

  if (!loaded) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-400">Loading results...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-400" />
          <span className="font-semibold">Retrace</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto">

          {/* Score */}
          <div className="text-center mb-12">
            <div className="text-8xl font-bold mb-2">
              <span className={getScoreColor()}>{percentage}%</span>
            </div>
            <div className="text-2xl mb-2">{getScoreEmoji()}</div>
            <p className="text-zinc-400 text-lg">{getScoreMessage()}</p>
          </div>

              {feedbackList.filter(item => (item.score ?? (item.confident ? 3 : 0)) < 2).length > 0 && (
      <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-5 mb-8">
        <p className="text-zinc-400 text-sm mb-3">
          Based on this session, here is what would likely come up again in a real interview:
        </p>
            <ul className="space-y-1.5">
      {[...new Set(
        feedbackList
          .filter(item => (item.score ?? (item.confident ? 3 : 0)) < 2)
          .map(item => item.topic || 'A topic from this session')
      )].map((topic, i) => (
        <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
          <span className="text-red-400 mt-0.5">•</span>
          {topic}
        </li>
      ))}
    </ul>
      </div>
    )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <MessageSquare className="w-6 h-6 text-violet-400 mb-2 mx-auto" />
              <div className="text-3xl font-bold mb-1">{total}</div>
              <div className="text-zinc-400 text-sm">Questions answered</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <TrendingUp className="w-6 h-6 text-violet-400 mb-2 mx-auto" />
              <div className="text-3xl font-bold mb-1">{score}</div>
              <div className="text-zinc-400 text-sm">Confident answers</div>
            </div>
          </div>

          {/* Feedback Breakdown */}
          {feedbackList.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Answer Breakdown</h2>
              <div className="space-y-4">
                {feedbackList.map((item, i) => {
                  const itemScore = item.score ?? (item.confident ? 3 : 0)
                  return (
                    <div key={i} className={`bg-zinc-900 border rounded-xl p-5 ${getCardBorder(itemScore)}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold ${getScoreBadge(itemScore)}`}>
                          {itemScore}
                        </div>
                        <div className="flex-1">
                          <p className="text-zinc-300 text-sm font-medium mb-1">
                            Q{i + 1}: {item.question.slice(0, 120)}...
                          </p>
                          <p className="text-zinc-500 text-sm mb-2">
                            Your answer: {item.answer.slice(0, 100)}...
                          </p>
                          <p className={`text-sm font-medium mb-2 ${getFeedbackColor(itemScore)}`}>
                            {item.feedback}
                          </p>
                          {item.explanation && (
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mt-2">
                              <p className="text-violet-300 text-xs font-semibold mb-1">💡 What a strong answer would cover</p>
                              <p className="text-zinc-300 text-sm">{item.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Repo */}
          {repoUrl && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8">
              <p className="text-zinc-500 text-xs mb-1">Repository reviewed</p>
              <p className="text-zinc-300 text-sm font-mono">
                {repoUrl.replace('https://github.com/', '')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push(`/session?repo=${encodeURIComponent(repoUrl)}`)}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors rounded-xl px-6 py-3 font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
                <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 transition-colors rounded-xl px-6 py-3 font-semibold"
        >
          Go to Dashboard
           </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 transition-colors rounded-xl px-6 py-3 font-semibold"
            >
              New Repository
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}