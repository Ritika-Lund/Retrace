'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleReset = async () => {
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brain className="w-8 h-8 text-violet-400" />
          <span className="text-2xl font-bold">Retrace</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2">Set new password</h1>
          <p className="text-zinc-400 text-sm mb-6">Enter your new password below.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {done ? (
            <p className="text-green-400 text-sm">Password updated! Redirecting to login...</p>
          ) : (
            <>
              <div className="mb-4">
                <label className="text-zinc-400 text-sm mb-2 block">New password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="text-zinc-400 text-sm mb-2 block">Confirm password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={handleReset}
                disabled={loading || !password || !confirm}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors rounded-xl py-3 font-semibold"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}