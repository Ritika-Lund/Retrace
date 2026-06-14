import { Suspense } from 'react'

export default function SessionLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    }>
      {children}
    </Suspense>
  )
}