'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Brain, ArrowLeft, RotateCcw, TrendingUp, MessageSquare, CheckCircle, XCircle } from 'lucide-react'

export default function ResultsPage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [repoUrl, setRepoUrl] = useState('')
  const [feedbackList, setFeedbackList] = useState([])
  const [loaded, setLoaded] = useState(false)

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

    const saveSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('sessions').insert({
        user_id: user.id,
        repo_url: r,
        score: s,
        total: t,
        percentage: t > 0 ? Math.round((s / t) * 100) : 0,
        feedback: f
      })

      
      const failedAnswers = f.filter(item => !item.confident)
      const confidentAnswers = f.filter(item => item.confident)

      // Advance or resolve weaknesses that were answered confidently this time
      for (const good of confidentAnswers) {
        const topic = good.topic || good.question.slice(0, 100)
        const { data: existingWeak } = await supabase
          .from('weaknesses')
          .select('*')
          .eq('user_id', user.id)
          .eq('topic', topic)
          .single()

        if (existingWeak) {
          const newStage = existingWeak.review_stage + 1
          const stageDays = [1, 3, 7, 14]
          const isResolved = newStage >= stageDays.length
          const nextReview = new Date()
          nextReview.setDate(nextReview.getDate() + (stageDays[newStage] || 14))

          await supabase
            .from('weaknesses')
            .update({
              review_stage: newStage,
              next_review_at: nextReview.toISOString(),
              resolved: isResolved
            })
            .eq('id', existingWeak.id)
        }
      }
      for (const failed of failedAnswers) {
        const topic = failed.topic || failed.question.slice(0, 100)
        const { data: existing } = await supabase
          .from('weaknesses')
          .select('*')
          .eq('user_id', user.id)
          .eq('topic', topic)
          .single()

        if (existing) {
          // Failed again — reset stage back, push review out by 1 day
          const nextReview = new Date()
          nextReview.setDate(nextReview.getDate() + 1)
          await supabase
            .from('weaknesses')
            .update({
              fail_count: existing.fail_count + 1,
              last_seen: new Date().toISOString(),
              review_stage: 0,
              next_review_at: nextReview.toISOString(),
              resolved: false
            })
            .eq('id', existing.id)
        } else {
          const nextReview = new Date()
          nextReview.setDate(nextReview.getDate() + 1)
          await supabase.from('weaknesses').insert({
            user_id: user.id,
            topic,
            repo_url: r,
            review_stage: 0,
            next_review_at: nextReview.toISOString()
          })
        }
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
    if (percentage >= 70) return "Strong performance! You know your codebase well."
    if (percentage >= 40) return "Room to grow. Some gaps in your understanding."
    return "You've been relying on AI too much. Time to dig deeper."
  }

  const getScoreEmoji = () => {
    if (percentage >= 70) return '🔥'
    if (percentage >= 40) return '⚡'
    return '💀'
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
                {feedbackList.map((item, i) => (
                  <div key={i} className={`bg-zinc-900 border rounded-xl p-5 ${item.confident ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <div className="flex items-start gap-3">
                      {item.confident
                        ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      }
                      <div className="flex-1">
                        <p className="text-zinc-300 text-sm font-medium mb-1">
                          Q{i + 1}: {item.question.slice(0, 120)}...
                        </p>
                        <p className="text-zinc-500 text-sm mb-2">
                          Your answer: {item.answer.slice(0, 100)}...
                        </p>
                        <p className={`text-sm font-medium mb-2 ${item.confident ? 'text-green-400' : 'text-red-400'}`}>
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
                ))}
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