import { requireAuth } from '@/lib/auth'

export default async function AboutPage() {
  // await requireAuth()

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            About <span className="text-[#00aeef]">StratOS</span>
          </h1>
          <p className="text-gray-400">Project information, legal disclaimers, and credits</p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {/* Project Overview */}
          <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-[#00aeef] rounded-full"></span>
              Project Overview
            </h2>
            <p className="text-gray-300 leading-relaxed">
              StratOS is a comprehensive match analytics platform designed for professional Valorant teams.
              It provides advanced performance metrics, AI-powered coaching insights, and evidence-based tactical analysis
              to help teams prepare for matches and improve strategic decision-making.
            </p>
          </section>

          {/* Hackathon Submission */}
          <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-cyan-400 rounded-full"></span>
              Hackathon Submission
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              This project began as a submission for a <strong className="text-[#00aeef]">JetBrains esports hackathon</strong>.
            </p>
            <p className="text-gray-400 text-sm">
              Valorant, VCT, and team logos are the property of their respective owners.
            </p>
          </section>

          {/* Legal Disclaimer */}
          <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-yellow-400 rounded-full"></span>
              Legal Disclaimer
            </h2>
            <div className="space-y-3 text-gray-300 leading-relaxed">
              <p>
                StratOS is <strong>not endorsed by Riot Games</strong> and does not reflect the views or opinions
                of Riot Games or anyone officially involved in producing or managing Riot Games properties.
              </p>
              <p>
                Riot Games and all associated properties are trademarks or registered trademarks of
                <strong className="text-red-400"> Riot Games, Inc.</strong>
              </p>
              <p className="text-sm text-gray-400 border-l-2 border-gray-700 pl-4">
                This is a fan-made project created for educational and analytical purposes.
                All game data is sourced from publicly available APIs.
              </p>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-green-400 rounded-full"></span>
              Technology Stack
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-[#00aeef] font-semibold mb-2">Frontend</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Next.js 15 (App Router)</li>
                  <li>• React 18</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-cyan-400 font-semibold mb-2">Backend</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• MongoDB</li>
                  <li>• Python (Data Pipeline)</li>
                  <li>• GRID Esports API</li>
                  <li>• Google Gemini</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-purple-400 rounded-full"></span>
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 bg-black/30 rounded-lg p-3">
                <span className="w-2 h-2 bg-[#00aeef] rounded-full mt-2"></span>
                <div>
                  <h3 className="text-white font-medium">Advanced Match Analytics</h3>
                  <p className="text-gray-400 text-sm">Comprehensive performance metrics and statistics</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-black/30 rounded-lg p-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></span>
                <div>
                  <h3 className="text-white font-medium">AI-Powered Coaching</h3>
                  <p className="text-gray-400 text-sm">AI generated tactical insights and recommendations</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-black/30 rounded-lg p-3">
                <span className="w-2 h-2 bg-green-400 rounded-full mt-2"></span>
                <div>
                  <h3 className="text-white font-medium">Evidence-Based Analysis</h3>
                  <p className="text-gray-400 text-sm">Data-driven decision making from real match events</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-black/30 rounded-lg p-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></span>
                <div>
                  <h3 className="text-white font-medium">Opponent Intelligence</h3>
                  <p className="text-gray-400 text-sm">Deep dive into opponent tendencies and patterns</p>
                </div>
              </div>
            </div>
          </section>

          {/* Credits & Developer Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Sources */}
            <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-[#00aeef] rounded-full"></span>
                Data Sources
              </h2>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center gap-2">
                  <span className="text-[#00aeef]">•</span>
                  <strong>GRID Esports API</strong> - Match data and event tracking
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-cyan-400">•</span>
                  <strong>Google Gemini</strong> - AI-powered coaching insights
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Team Assets</strong> - Official team branding and logos
                </p>
              </div>
            </section>

            {/* Developer */}
            <section className="card backdrop-blur-xl bg-gray-900/70 p-8 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-purple-400 rounded-full"></span>
                Developer
              </h2>
              <div className="flex flex-col items-center text-center">
                {/* Profile Picture Placeholder */}
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 mb-4 overflow-hidden">
                  <img src="/Headshot.jpeg" alt="Developer" className="w-full h-full object-cover" />
                </div>
                {/* Name */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  Daniel Torres
                </h3>
                {/* Bio/Description */}
                <p className="text-gray-400 text-sm leading-relaxed">
                  Computer Science student at Cleveland State University.

                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
