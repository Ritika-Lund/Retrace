import { Suspense } from 'react'

export default function ResultsLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading results...</p>
      </div>
    }>
      {children}
    </Suspense>
  )
}