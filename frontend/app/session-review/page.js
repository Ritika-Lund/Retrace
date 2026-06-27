'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brain, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SessionReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()
      if (error || !data) {
        router.push('/dashboard')
        return
      }
      setSession(data)
      setLoading(false)
    }
    if (sessionId) fetchSession()
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-400">Loading session...</p>
    </div>
  )

  const feedbackList = session.feedback || []
  const percentage = session.percentage

  const getScoreColor = () => {
    if (percentage >= 70) return 'text-green-400'
    if (percentage >= 40) return 'text-yellow-400'
    return 'text-red-400'
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-400" />
          <span className="font-semibold">Retrace</span>
        </div>
        <span className="text-zinc-500 text-sm hidden md:block">Session Review</span>
      </div>

      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-12">
            <div className="text-8xl font-bold mb-2">
              <span className={getScoreColor()}>{percentage}%</span>
            </div>
            <p className="text-zinc-500 text-sm mb-2">
              {new Date(session.created_at).toLocaleDateString()} · {session.repo_url.replace('https://github.com/', '')}
            </p>
            <p className="text-zinc-400 text-sm">{session.total} questions · {session.score} confident answers</p>
          </div>

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

          <div className="flex justify-center">
            <button
              onClick={() => router.push(`/session?repo=${encodeURIComponent(session.repo_url)}`)}
              className="bg-violet-600 hover:bg-violet-500 transition-colors rounded-xl px-6 py-3 font-semibold"
            >
              Retry this repo
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}