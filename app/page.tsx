import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">C9 StratOS</h1>
      <p className="text-gray-700 max-w-2xl">
        C9 StratOS is an AI assistant coach for the Cloud9 Valorant coaching staff. It aggregates
        matches, computes team overviews, and helps generate coaching insights.
      </p>
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
