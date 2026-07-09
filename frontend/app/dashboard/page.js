'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Plus, LogOut, TrendingUp, Clock, Code } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [repoUrl, setRepoUrl] = useState('')
  const [weaknesses, setWeaknesses] = useState([])
  const [dueReviews, setDueReviews] = useState([])
  const [sessionPage, setSessionPage] = useState(0)
  const [hasMoreSessions, setHasMoreSessions] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [totalSessions, setTotalSessions] = useState(0)
  const [averageScore, setAverageScore] = useState(0)
  const [totalRepos, setTotalRepos] = useState(0)

  const SESSIONS_PER_PAGE = 5

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      fetchSessions(user.id)
      fetchWeaknesses(user.id)
      fetchDueReviews(user.id)
    }
    getUser()
  }, [])

  const fetchSessions = async (userId, page = 0) => {
    const from = page * SESSIONS_PER_PAGE
    const to = from + SESSIONS_PER_PAGE - 1
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)
    const { data: allSessions } = await supabase
  .from('sessions')
  .select('percentage')
  .eq('user_id', userId)
if (allSessions && allSessions.length > 0) {
  const avg = Math.round(allSessions.reduce((acc, s) => acc + s.percentage, 0) / allSessions.length)
  setAverageScore(avg)
}

const { data: allRepos } = await supabase
  .from('sessions')
  .select('repo_url')
  .eq('user_id', userId)
if (allRepos) setTotalRepos(new Set(allRepos.map(s => s.repo_url)).size)
    if (!error) {
      if (page === 0) {
        setSessions(data || [])
      } else {
        setSessions(prev => [...prev, ...(data || [])])
      }
      setHasMoreSessions((data || []).length === SESSIONS_PER_PAGE)
    }

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count !== null) setTotalSessions(count)

    setLoading(false)
  }

  const fetchWeaknesses = async (userId) => {
    const { data, error } = await supabase
      .from('weaknesses')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('fail_count', { ascending: false })
      .limit(5)
    if (!error) setWeaknesses(data || [])
  }

  const fetchDueReviews = async (userId) => {
    const { data, error } = await supabase
      .from('weaknesses')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .lte('next_review_at', new Date().toISOString())
    if (!error) setDueReviews(data || [])
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim() || !user) return
    await supabase.from('feedback').insert({
      user_id: user.id,
      message: feedbackText.trim()
    })
    setFeedbackText('')
    setFeedbackSent(true)
    setTimeout(() => {
      setShowFeedback(false)
      setFeedbackSent(false)
    }, 1500)
  }

  const deleteSession = async (sessionId) => {
    const confirmed = window.confirm('Delete this session? This cannot be undone.')
    if (!confirmed) return
    await supabase.from('sessions').delete().eq('id', sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setTotalSessions(prev => prev - 1)
  }

  const normalizeRepoUrl = (input) => {
  const trimmed = input.trim()
  
  // Already a full URL
  if (trimmed.startsWith('https://github.com/')) {
    return trimmed
  }
  
  // Markdown link format: [text](url)
  const markdownMatch = trimmed.match(/\[.*?\]\((https?:\/\/[^)]+)\)/)
  if (markdownMatch) {
    return markdownMatch[1]
  }
  
  // Short format: username/repo
  if (trimmed.match(/^[\w.-]+\/[\w.-]+$/)) {
    return `https://github.com/${trimmed}`
  }
  
  return trimmed
}

const handleStart = () => {
  if (repoUrl.trim()) {
    const normalized = normalizeRepoUrl(repoUrl)
    router.push(`/session?repo=${encodeURIComponent(normalized)}`)
  }
}


  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-400" />
          <span className="text-xl font-bold">Retrace</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFeedback(true)}
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Feedback
          </button>
          <span className="text-zinc-400 text-sm">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Track your code understanding over time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <TrendingUp className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">{averageScore}%</div>
            <div className="text-zinc-400 text-sm">Average score</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Clock className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">{totalSessions}</div>
            <div className="text-zinc-400 text-sm">Sessions completed</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Code className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">{totalRepos}</div>
            <div className="text-zinc-400 text-sm">Repos reviewed</div>
          </div>
        </div>

        {dueReviews.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-300 mb-1">⏰ {dueReviews.length} topic{dueReviews.length > 1 ? 's' : ''} due for review</p>
              <p className="text-zinc-400 text-sm">Start a new interview and Retrace will re-test these automatically.</p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-violet-400" />
            Start New Interview
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              onClick={handleStart}
              className="bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg px-6 py-3 font-semibold"
            >
              Start
            </button>
          </div>
        </div>

        {weaknesses.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4">🧠 Weakness Map</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm mb-4">Topics you keep struggling to explain:</p>
              <div className="space-y-3">
                {weaknesses.map((w) => (
                  <div key={w.id} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0">
                      {w.fail_count}
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-300 text-sm mb-1">{w.topic}</p>
                      <p className="text-zinc-600 text-xs mb-1">{w.repo_url?.replace('https://github.com/', '')}</p>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                          className="bg-red-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(w.fail_count * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-4">Session History</h2>
          {loading ? (
            <p className="text-zinc-400">Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-2">No sessions yet</p>
              <p className="text-zinc-600 text-sm">Start your first interview above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => router.push(`/session-review?id=${session.id}`)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-zinc-600 transition-colors"
                >
                  <div>
                    <p className="font-medium mb-1">
                      {session.repo_url.replace('https://github.com/', '')}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      {new Date(session.created_at).toLocaleDateString()} · {session.total} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      session.percentage >= 70 ? 'text-green-400' :
                      session.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {session.percentage}%
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-2"
                      title="Delete session"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {hasMoreSessions && (
                <button
                  onClick={() => {
                    const nextPage = sessionPage + 1
                    setSessionPage(nextPage)
                    fetchSessions(user.id, nextPage)
                  }}
                  className="w-full mt-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors rounded-xl py-3 text-zinc-400 text-sm"
                >
                  Load more sessions
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Send Feedback</h3>
            {feedbackSent ? (
              <p className="text-green-400 text-sm">Thanks! Your feedback was sent.</p>
            ) : (
              <>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="How can we make Retrace better for you?"
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="text-zinc-400 hover:text-white text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFeedback}
                    className="bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg px-4 py-2 text-sm font-semibold"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}