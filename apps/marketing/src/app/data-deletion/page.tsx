import { ContactForm } from '@/components/ContactForm';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import Link from 'next/link';

export const metadata = pageMetadata({
  title: 'Data Deletion',
  description: 'How to disconnect TEAMeIT integrations and request deletion of account and provider data. Use this URL in Meta data deletion configuration.',
  path: '/data-deletion',
});

export default function DataDeletionPage() {
  const publicUrl = `${site.siteUrl}/data-deletion`;

  return (
    <article className="section">
      <div className="container-page max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">Data deletion</h1>
        <p className="mt-4 text-slate-600">
          This page is the public instructions URL for user data deletion, including Meta’s data deletion request callback configuration. Canonical URL:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{publicUrl}</code>
        </p>

        <div className="prose-legal mt-10">
          <h2>Disconnect integrations</h2>
          <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-7 text-slate-700">
            <li>Sign in to the TEAMeIT application.</li>
            <li>Open Integrations for your workspace.</li>
            <li>Disconnect Facebook, Instagram, LinkedIn, WhatsApp, SMS, email, or other connections you no longer want TEAMeIT to use.</li>
            <li>Optionally revoke TEAMeIT from the provider’s own security or business settings (Facebook Business, LinkedIn authorized apps, etc.).</li>
          </ol>
          <p>
            Disconnecting stops new API calls with that connection. Content already stored in TEAMeIT (posts, messages, logs) remains until deleted in-product or via a deletion request.
          </p>

          <h2>Request account and provider-data deletion</h2>
          <p>
            To delete your TEAMeIT user account, tenant data you are authorized to delete, and provider-derived data TEAMeIT stored for those connections, send a request using the form below or email{' '}
            <span className="placeholder-note">{site.deletionEmail}</span> from the address on your account. Include workspace name, user email, and which providers to delete.
          </p>
          <p>
            Expected processing time: <strong>within 30 days</strong> of a validated request. We may need to verify you control the account. Some records may be retained if legally required.
          </p>
          <p>
            TEAMeIT does not collect Facebook or Instagram passwords. OAuth tokens associated with disconnected or deleted integrations are revoked or deleted as part of the request where we still hold them.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Deletion request</h2>
          <p className="mb-4 mt-2 text-sm text-slate-600">
            Also reachable at <a className="text-accent-indigo" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>. Related:{' '}
            <Link className="text-accent-indigo" href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
          <ContactForm intent="deletion" />
        </div>
      </div>
    </article>
  );
}
