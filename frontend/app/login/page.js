'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Mail, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }
  const handleForgotPassword = async () => {
  if (!resetEmail.trim()) return
  setLoading(true)
  setError('')
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
    setResetSent(true)
  } catch (err) {
    setError(err.message)
  }
  setLoading(false)
}

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brain className="w-8 h-8 text-violet-400" />
          <span className="text-2xl font-bold">Retrace</span>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-zinc-400 text-sm mb-6">
            {isSignUp ? 'Start tracking your code understanding' : 'Sign in to your account'}
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm mb-4">
              {message}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="text-zinc-400 text-sm mb-2 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="text-zinc-400 text-sm mb-2 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>
          {!isSignUp && (
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-zinc-500 hover:text-violet-400 text-xs transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
          {/* Button */}
          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors rounded-xl py-3 font-semibold"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Toggle */}
          <p className="text-center text-zinc-400 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : 'No account yet?'}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-violet-400 hover:text-violet-300 ml-1"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
        {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Reset your password</h3>
            {resetSent ? (
              <p className="text-green-400 text-sm">Check your email for a password reset link.</p>
            ) : (
              <>
                <p className="text-zinc-400 text-sm mb-4">Enter your email and we will send you a reset link.</p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-zinc-400 hover:text-white text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading || !resetEmail.trim()}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors rounded-lg px-4 py-2 text-sm font-semibold"
                  >
                    Send reset link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}