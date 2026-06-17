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
  const [interviewDate, setInterviewDate] = useState('')
  const [savedDate, setSavedDate] = useState(null)
  const [dueReviews, setDueReviews] = useState([])

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
      fetchSettings(user.id)
    }
    getUser()
  }, [])
  
  const fetchSessions = async (userId) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error) setSessions(data || [])
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
  const fetchSettings = async (userId) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (data) {
    setSavedDate(data.interview_date)
    setInterviewDate(data.interview_date || '')
  }
}

const saveInterviewDate = async () => {
  if (!user || !interviewDate) return
  const { data: existing } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('user_settings')
      .update({ interview_date: interviewDate })
      .eq('user_id', user.id)
  } else {
    await supabase
      .from('user_settings')
      .insert({ user_id: user.id, interview_date: interviewDate })
  }
  setSavedDate(interviewDate)
}

const getDaysLeft = () => {
  if (!savedDate) return null
  const diff = new Date(savedDate) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleStart = () => {
    if (repoUrl.trim()) {
      router.push(`/session?repo=${encodeURIComponent(repoUrl)}`)
    }
  }

  const averageScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.percentage, 0) / sessions.length)
    : 0

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-400" />
          <span className="text-xl font-bold">Retrace</span>
        </div>
        <div className="flex items-center gap-4">
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

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Track your code understanding over time</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <TrendingUp className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">{averageScore}%</div>
            <div className="text-zinc-400 text-sm">Average score</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Clock className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">{sessions.length}</div>
            <div className="text-zinc-400 text-sm">Sessions completed</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Code className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">
              {new Set(sessions.map(s => s.repo_url)).size}
            </div>
            <div className="text-zinc-400 text-sm">Repos reviewed</div>
          </div>
        </div>
        {/* Due Reviews */}
  {dueReviews.length > 0 && (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6 flex items-center justify-between">
      <div>
        <p className="font-semibold text-yellow-300 mb-1">⏰ {dueReviews.length} topic{dueReviews.length > 1 ? 's' : ''} due for review</p>
        <p className="text-zinc-400 text-sm">Start a new interview and Retrace will re-test these automatically.</p>
      </div>
    </div>
  )}
        {/* Daily Brief / Countdown */}
<div className="bg-gradient-to-br from-violet-600/20 to-zinc-900 border border-violet-500/30 rounded-xl p-6 mb-10">
  <h2 className="text-lg font-semibold mb-4">📅 Interview Countdown</h2>
  {savedDate ? (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl font-bold text-violet-400">{getDaysLeft()}</div>
        <div>
          <p className="text-zinc-300">days left until your interview</p>
          <p className="text-zinc-500 text-sm">{new Date(savedDate).toLocaleDateString()}</p>
        </div>
      </div>
      {weaknesses.length > 0 && (
        <div className="bg-black/30 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-2">🎯 Today's focus area:</p>
          <p className="text-zinc-200 text-sm">{weaknesses[0]?.topic}...</p>
        </div>
      )}
      <button
        onClick={() => setSavedDate(null)}
        className="text-zinc-500 hover:text-zinc-300 text-xs mt-3"
      >
        Change date
      </button>
    </div>
  ) : (
    <div className="flex gap-3">
      <input
        type="date"
        value={interviewDate}
        onChange={(e) => setInterviewDate(e.target.value)}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
      />
      <button
        onClick={saveInterviewDate}
        className="bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg px-6 py-3 font-semibold"
      >
        Set Date
      </button>
    </div>
  )}
</div>

        {/* New Interview */}
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

        {/* Weakness Map */}
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
                      <p className="text-zinc-300 text-sm mb-1">{w.topic}...</p>
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

        {/* Session History */}
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
                <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium mb-1">
                      {session.repo_url.replace('https://github.com/', '')}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      {new Date(session.created_at).toLocaleDateString()} · {session.company_mode} · {session.total} questions
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${
                    session.percentage >= 70 ? 'text-green-400' :
                    session.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {session.percentage}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}