import { FinalCta } from '@/components/FinalCta';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Features',
  description:
    'Social publishing, calendar, inbox, WhatsApp and SMS campaigns, automation with delay and resume, analytics, notifications, audit logs, tenants, and billing.',
  path: '/features',
});

const features = [
  {
    title: 'Social media publishing',
    body: 'Create and persist posts in your tenant. Publishing adapters send to connected Facebook, Instagram, and LinkedIn accounts when those integrations are authorized. Failed sends are recorded so teams can retry from the product.',
  },
  {
    title: 'Content calendar and scheduling',
    body: 'The publishing workspace includes a calendar-style view and scheduled-for timestamps. A scheduler worker picks up due posts. Availability depends on your deployment having the API worker running.',
  },
  {
    title: 'Facebook, Instagram, and LinkedIn integrations',
    body: 'Connect Pages, professional Instagram accounts, and LinkedIn via OAuth. TEAMeIT stores access tokens and provider account identifiers—not your Facebook or Instagram password. You can disconnect an integration at any time.',
  },
  {
    title: 'WhatsApp and SMS campaigns',
    body: 'Campaign tools include WhatsApp and SMS channels alongside email. Delivery uses Meta WhatsApp Cloud API and Twilio where those credentials are configured for the tenant. Template and provider rules still apply.',
  },
  {
    title: 'Inbox and conversation management',
    body: 'A unified inbox lists conversations and messages, supports assignment, and can send replies through connected providers after they confirm delivery.',
  },
  {
    title: 'Workflow automation',
    body: 'Visual workflow builder with save/load, execution, and history. Automations run in the tenant that owns them.',
  },
  {
    title: 'Delay and resume automation',
    body: 'Workflows can wait and resume instead of completing in a single request. Execution state is stored so delayed steps can continue after the wait.',
  },
  {
    title: 'Analytics and reports',
    body: 'Dashboards aggregate tenant conversation and message activity. Saved reports can be created from the reports surface. Channel-native advertising metrics appear when the related integration has synced data.',
  },
  {
    title: 'Notifications',
    body: 'Workspace notifications are listed in-product and can be marked read. They are scoped to the tenant and, when applicable, the signed-in user.',
  },
  {
    title: 'Audit logs',
    body: 'Administrative actions such as settings updates are written to an audit log for the tenant.',
  },
  {
    title: 'Team and tenant management',
    body: 'Create a workspace, invite members with roles, and keep client or brand work isolated by tenant.',
  },
  {
    title: 'Billing and subscription management',
    body: 'The application includes a billing status surface and Stripe webhook/checkout endpoints. Checkout is not enabled until Stripe keys are configured and checkout is turned on for that deployment. We do not claim live self-serve billing until that is true for your environment.',
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-navy-900 py-16 text-white">
        <div className="container-page max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight">Product features</h1>
          <p className="mt-4 text-slate-300">
            Capabilities described here exist as product surfaces in TEAMeIT. Provider delivery still requires correctly configured OAuth apps, webhooks, and secrets in your environment.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold">{f.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{f.body}</p>
            </article>
          ))}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
