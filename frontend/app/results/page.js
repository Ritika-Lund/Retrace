'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Brain, ArrowLeft, RotateCcw, TrendingUp, MessageSquare } from 'lucide-react'

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const score = parseInt(searchParams.get('score') || '0')
  const total = parseInt(searchParams.get('total') || '0')
  const repoUrl = searchParams.get('repo') || ''
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
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
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">

          {/* Score Circle */}
          <div className="mb-8">
            <div className="text-8xl font-bold mb-2">
              <span className={getScoreColor()}>{percentage}%</span>
            </div>
            <div className="text-2xl mb-2">{getScoreEmoji()}</div>
            <p className="text-zinc-400 text-lg">{getScoreMessage()}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <MessageSquare className="w-6 h-6 text-violet-400 mb-2 mx-auto" />
              <div className="text-3xl font-bold mb-1">{total}</div>
              <div className="text-zinc-400 text-sm">Questions answered</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <TrendingUp className="w-6 h-6 text-violet-400 mb-2 mx-auto" />
              <div className="text-3xl font-bold mb-1">{score}</div>
              <div className="text-zinc-400 text-sm">Confident answers</div>
            </div>
          </div>

          {/* Repo */}
          {repoUrl && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 text-left">
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
