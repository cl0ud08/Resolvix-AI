import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          AI-Powered Support Platform
        </div>
        <h1 className="text-5xl font-bold mb-4 text-slate-900 tracking-tight">
          Smart Support
        </h1>
        <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto">
          Microservices architecture with real-time AI triage, RAG retrieval, and event-driven processing.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-colors shadow-sm"
          >
            Create account
          </Link>
        </div>
        <p className="text-slate-300 text-xs mt-10">
          Built with FastAPI · Redis · RAG · Next.js · Docker Compose
        </p>
      </div>
    </main>
  )
}