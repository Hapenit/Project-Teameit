import Link from 'next/link';
import { Calendar, Inbox, LineChart, Megaphone, Shield, Workflow } from 'lucide-react';
import { DashboardPreview } from '@/components/DashboardPreview';
import { Faq } from '@/components/Faq';
import { FinalCta } from '@/components/FinalCta';
import { PricingTable } from '@/components/PricingTable';
import { pageMetadata } from '@/lib/seo';
import { appSignupUrl, site } from '@/lib/site';

export const metadata = pageMetadata({
  title: site.tagline,
  description: site.description,
  path: '/',
});

const benefits = [
  {
    icon: Calendar,
    title: 'Publish from one calendar',
    body: 'Draft and schedule social posts in a workspace calendar instead of hopping between native apps.',
  },
  {
    icon: Inbox,
    title: 'Conversations in one inbox',
    body: 'Bring page comments, WhatsApp, SMS, and email threads into a shared team inbox with assignment.',
  },
  {
    icon: Megaphone,
    title: 'Campaigns across channels',
    body: 'Plan audience-based campaigns for email today, with WhatsApp and SMS campaign tools in the same product surface.',
  },
  {
    icon: Workflow,
    title: 'Automate follow-up',
    body: 'Build workflows with delay and resume so teams are not babysitting every step by hand.',
  },
  {
    icon: LineChart,
    title: 'See activity, not vanity claims',
    body: 'Analytics and reports summarize tenant activity from TEAMeIT data. Provider-native ads metrics depend on connected integrations.',
  },
  {
    icon: Shield,
    title: 'Tenant-aware teams',
    body: 'Each workspace has its own members, settings, notifications, audit logs, and billing status.',
  },
];

const channels = ['Facebook', 'Instagram', 'LinkedIn', 'WhatsApp', 'SMS', 'Email'];

const useCases = [
  {
    title: 'In-house marketing teams',
    body: 'Coordinate publishing, replies, and reporting without a patchwork of logins.',
  },
  {
    title: 'Agencies',
    body: 'Separate client work into tenants so credentials, content, and logs stay scoped.',
  },
  {
    title: 'Operations and support',
    body: 'Route conversations and keep an audit trail of who changed settings or sent messages.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.35),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.25),transparent_40%)]" />
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-200">{site.name}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Manage, automate, and grow your digital presence
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              TEAMeIT is an omnichannel platform for social publishing, conversation management, campaigns, analytics, and workflow automation—built for businesses, agencies, and teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={appSignupUrl} className="btn-primary">
                Start Free
              </a>
              <Link href="/contact" className="btn-secondary !border-white/20 !bg-white/5 !text-white hover:!bg-white/10">
                Book a Demo
              </Link>
            </div>
          </div>
          <div className="animate-fade-up-delay">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight">Why teams use TEAMeIT</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            One tenant workspace for the work that usually lives in six tabs.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <article key={item.title} className="surface-card p-6">
                <item.icon className="h-5 w-5 text-accent-indigo" aria-hidden />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight">Supported channels</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Connect provider accounts with OAuth or official APIs. TEAMeIT does not collect Facebook or Instagram passwords.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {channels.map((c) => (
              <li key={c} className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-center text-sm font-semibold">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight">Built for how work is actually organized</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {useCases.map((item) => (
              <article key={item.title} className="rounded-2xl bg-navy-900 p-6 text-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight">What customers say</h2>
          <p className="mt-2 text-sm text-slate-500">
            <span className="placeholder-note">Placeholder testimonials</span> — not from real customers.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ['“We needed one place for posts and replies.”', 'Marketing lead, [Company — placeholder]'],
              ['“Tenant separation is the reason we evaluated TEAMeIT.”', 'Agency operator, [Company — placeholder]'],
              ['“Automation delay/resume is the workflow we were missing.”', 'Ops manager, [Company — placeholder]'],
            ].map(([quote, who]) => (
              <blockquote key={who} className="rounded-2xl border border-dashed border-amber-300 bg-white p-6">
                <p className="text-slate-800">{quote}</p>
                <footer className="mt-4 text-sm text-slate-500">{who}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight">Pricing preview</h2>
          <p className="mt-3 text-slate-600">
            See full comparison on the{' '}
            <Link href="/pricing" className="font-medium text-accent-indigo hover:underline">
              pricing page
            </Link>
            .
          </p>
          <div className="mt-8">
            <PricingTable compact />
          </div>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-page">
          <h2 className="mb-8 text-3xl font-semibold tracking-tight">FAQ</h2>
          <Faq />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
