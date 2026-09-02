import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="mb-6">Blog Agent</h2>
          <p className="lead mb-8">Content Operating System for Codewave</p>
          <p className="text-lg text-slate-700 mb-8">
            Generate publication-ready blog articles with AI assistance, human approval, and measurable outcomes.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-white border-2 border-signal rounded-lg p-8 mb-12">
          <h2 className="text-editorial mb-6">Ready to Generate Your First Blog?</h2>

          <p className="mb-6 text-slate-700">
            Write smarter. Publish faster.
          </p>

          <div className="flex gap-4 flex-wrap mb-8">
            <Link href="/demo" className="btn-primary">
              Open Demo →
            </Link>
            <a href="https://github.com/your-org/blog-agent" className="btn-secondary">
              View GitHub
            </a>
          </div>

          {/* <p className="text-xs text-slate-600">
            💡 No API keys needed — uses demo mode by default. Add ANTHROPIC_API_KEY to use live Claude.
          </p> */}
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="border border-slate-300 rounded-lg p-6">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-medium mb-2">Intelligent Drafting</h3>
            <p className="text-sm text-slate-600">
              AI generates publication-ready drafts from brief + outline
            </p>
          </div>

          <div className="border border-slate-300 rounded-lg p-6">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-medium mb-2">AI Critique</h3>
            <p className="text-sm text-slate-600">
              Automatic quality scoring across evidence, clarity, brand alignment
            </p>
          </div>

          <div className="border border-slate-300 rounded-lg p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-medium mb-2">Measurable Outcomes</h3>
            <p className="text-sm text-slate-600">
              Track search performance, engagement, and lead outcomes
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-copper/10 border border-copper rounded-lg p-8 text-center">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-bold text-copper">2000+</div>
              <p className="text-sm text-slate-600">Words per draft</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-copper">&lt;60s</div>
              <p className="text-sm text-slate-600">Generation time</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-copper">0-100</div>
              <p className="text-sm text-slate-600">Quality score</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-300 text-center text-sm text-slate-600">
          <p>
            🚀 <strong>Blog Agent</strong> — Marketing MVP
          </p>
          <p className="mt-2">
            Built with Next.js, Claude API, and Drizzle ORM
          </p>
        </div>
      </div>
    </main>
  );
}
