import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Zap, Users, CheckCircle2, ExternalLink } from 'lucide-react'

const PODS = [
  {
    name: 'AI Product Pod',
    members: 3,
    roles: ['Senior ML Engineer', 'Full-Stack Engineer', 'AI-Native PM'],
    skills: ['Claude / GPT-4', 'Python', 'React', 'RAG', 'Prompt Engineering', 'LangChain'],
    description: 'End-to-end AI feature development: model integration, API layer, and streaming UI. Ship production AI features in sprints, not months.',
    monthlyRate: '$48,000',
    tasks: ['AI feature development & LLM integration', 'RAG pipeline design & implementation', 'Prompt engineering & evaluation frameworks', 'Streaming UI & real-time AI responses', 'Model cost optimization & monitoring'],
    ideal: 'Product teams adding AI capabilities to existing applications, or building AI-native products from scratch.',
  },
  {
    name: 'Full-Stack Growth Pod',
    members: 3,
    roles: ['Senior Full-Stack Engineer', 'UI/UX Engineer', 'Backend Engineer'],
    skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'TypeScript', 'Tailwind CSS'],
    description: 'Cross-functional team for rapid feature development. Product engineer + designer + backend. Perfect for sprint-based delivery on web applications.',
    monthlyRate: '$42,000',
    tasks: ['Feature sprints with weekly deliverables', 'UI/UX design & implementation', 'API development & database design', 'Performance optimization & testing', 'CI/CD pipeline maintenance'],
    ideal: 'Startups and scale-ups that need a full product team without the overhead of hiring. Ship features every sprint.',
  },
  {
    name: 'Platform & DevOps Pod',
    members: 2,
    roles: ['Principal DevOps Engineer', 'Senior Platform Engineer'],
    skills: ['Terraform', 'Kubernetes', 'AWS / GCP', 'GitHub Actions', 'Prometheus', 'ArgoCD'],
    description: 'Infrastructure, CI/CD, monitoring, and reliability. Keep your platform running, your deploys fast, and your costs under control.',
    monthlyRate: '$36,000',
    tasks: ['Infrastructure as code (Terraform / Pulumi)', 'CI/CD pipeline design & optimization', 'Monitoring, alerting & incident response', 'Cloud cost optimization', 'Security hardening & compliance'],
    ideal: 'Engineering teams that have outgrown manual deployments and need production-grade infrastructure without hiring a dedicated platform team.',
  },
  {
    name: 'Data & Analytics Pod',
    members: 3,
    roles: ['Senior Data Engineer', 'Analytics Engineer', 'Data Scientist'],
    skills: ['Python', 'dbt', 'Snowflake / BigQuery', 'Airflow', 'SQL', 'Looker / Metabase'],
    description: 'Build your data stack from ingestion to insights. ETL pipelines, data warehouse, analytics dashboards, and ML-ready data infrastructure.',
    monthlyRate: '$45,000',
    tasks: ['Data pipeline design & implementation', 'Data warehouse architecture (dbt + Snowflake)', 'Analytics dashboard development', 'Data quality monitoring & governance', 'ML feature engineering & model data prep'],
    ideal: 'Companies sitting on valuable data but lacking the infrastructure to turn it into actionable insights or AI-ready datasets.',
  },
]

export default function PodsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <nav className="flex items-center gap-2 text-sm text-[#94A3B8] mb-10">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors">
            <ArrowLeft size={14} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#0F172A]">Pods</span>
        </nav>

        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 border border-[#F472B6]/30 rounded-full px-3 py-1 mb-6">
            <Zap size={12} className="text-[#F472B6]" />
            <span className="text-[#F472B6] text-xs font-medium">Pre-configured Teams</span>
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-[#0F172A] mb-4">
            Pods by FullStack
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed">
            Cross-functional engineering teams assembled around a defined capability set. Each pod operates
            as an autonomous delivery unit with an embedded lead — like hiring a team, without the hiring.
            Every pod member is an AI-native engineer with a measured velocity score.
          </p>
        </div>

        <div className="space-y-8">
          {PODS.map((pod) => (
            <div key={pod.name} className="bg-white border border-[#E2E8F0] rounded-xl p-8 hover:border-[#F472B6]/30 transition-colors">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F472B6]/10 flex items-center justify-center">
                      <Users size={18} className="text-[#F472B6]" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-xl text-[#0F172A]">{pod.name}</h2>
                      <p className="text-[#94A3B8] text-xs">{pod.members} engineers — {pod.roles.join(', ')}</p>
                    </div>
                  </div>

                  <p className="text-[#64748B] text-sm leading-relaxed mb-5">{pod.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {pod.skills.map((s) => (
                      <span key={s} className="text-xs bg-[#F1F5F9] text-[#64748B] rounded px-2 py-1 border border-[#E2E8F0]">{s}</span>
                    ))}
                  </div>

                  <h3 className="text-[#0F172A] text-sm font-semibold mb-3">What this pod delivers:</h3>
                  <ul className="space-y-2 mb-5">
                    {pod.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-2.5 text-sm text-[#64748B]">
                        <CheckCircle2 size={14} className="text-[#7C3AED] mt-0.5 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>

                  <p className="text-[#94A3B8] text-xs"><strong className="text-[#64748B]">Ideal for:</strong> {pod.ideal}</p>
                </div>

                <div className="lg:w-64 shrink-0">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 text-center">
                    <p className="text-[#94A3B8] text-xs uppercase tracking-widest mb-2">Monthly Rate</p>
                    <p className="font-mono-brand font-bold text-3xl text-[#0F172A] mb-1">{pod.monthlyRate}</p>
                    <p className="text-[#94A3B8] text-xs mb-5">{pod.members} engineers / month</p>
                    <a
                      href="mailto:new_customer@fullstacklabs.co?subject=Pod%20Inquiry:%20${encodeURIComponent(pod.name)}"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#7C3AED] text-white font-semibold text-sm rounded-lg hover:bg-[#8B5CF6] transition-colors"
                    >
                      <ExternalLink size={13} />
                      Contact FullStack
                    </a>
                    <p className="text-[#94A3B8] text-[10px] mt-3">1-month minimum, rolling</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-[#7C3AED]/5 via-[#6366F1]/5 to-[#EC4899]/5 border border-[#7C3AED]/20 rounded-xl p-8 text-center">
          <h3 className="font-heading font-bold text-xl text-[#0F172A] mb-2">Need a custom pod configuration?</h3>
          <p className="text-[#64748B] text-sm mb-5 max-w-lg mx-auto">
            We can assemble a pod with any combination of skills and team size. Tell us what you need and we'll configure the right team.
          </p>
          <a
            href="mailto:new_customer@fullstacklabs.co?subject=Custom%20Pod%20Request"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7C3AED] text-white font-semibold text-sm rounded-lg hover:bg-[#8B5CF6] transition-colors"
          >
            <ExternalLink size={13} />
            Contact FullStack to get onboarded
          </a>
        </div>
      </div>
    </div>
  )
}
