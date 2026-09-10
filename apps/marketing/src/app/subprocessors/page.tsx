import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Subprocessors',
  description: 'Infrastructure and channel providers that may process TEAMeIT customer data, with purpose and privacy links.',
  path: '/subprocessors',
});

const rows = [
  {
    name: 'Supabase',
    purpose: 'Authentication, PostgreSQL database, file storage, and related backend infrastructure',
    data: 'Account records, tenant data, application content, stored credentials/tokens as configured, media files',
    href: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    purpose: 'Hosting the public marketing site and, depending on deployment, the web application',
    data: 'Request logs, IP addresses, and any data you submit through hosted forms or the app',
    href: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Render',
    purpose: 'Optional application or API hosting (used when that environment is selected)',
    data: 'Application logs and the data processed by the hosted API',
    href: 'https://render.com/privacy',
  },
  {
    name: 'Railway',
    purpose: 'Optional API hosting (documented for some TEAMeIT deployments)',
    data: 'Application logs and API-processed tenant data',
    href: 'https://railway.com/legal/privacy',
  },
  {
    name: 'Meta (Facebook, Instagram, WhatsApp)',
    purpose: 'OAuth, Page/Instagram publishing, messaging, WhatsApp Cloud API, and webhooks',
    data: 'Authorized account identifiers, tokens, posts, comments, messages, and webhook payloads',
    href: 'https://www.facebook.com/privacy/policy/',
  },
  {
    name: 'LinkedIn',
    purpose: 'OAuth and LinkedIn publishing/organization features authorized by the customer',
    data: 'Authorized profile/organization identifiers, tokens, and content you publish',
    href: 'https://www.linkedin.com/legal/privacy-policy',
  },
  {
    name: 'Twilio',
    purpose: 'SMS sending and related messaging status',
    data: 'Phone numbers, message bodies, and delivery metadata for messages you send',
    href: 'https://www.twilio.com/en-us/legal/privacy',
  },
  {
    name: 'Stripe',
    purpose: 'Subscription billing when Stripe is configured for a deployment',
    data: 'Customer billing email, plan/status identifiers, and payment method data processed by Stripe',
    href: 'https://stripe.com/privacy',
  },
  {
    name: 'Customer-configured SMTP / email provider',
    purpose: 'Outbound and inbound email using hosts the customer supplies (via Nodemailer/IMAP in TEAMeIT)',
    data: 'Email addresses, message content, and SMTP credentials the customer stores in their tenant',
    href: '/privacy',
  },
];

export default function SubprocessorsPage() {
  return (
    <article className="section">
      <div className="container-page">
        <h1 className="text-4xl font-semibold tracking-tight">Subprocessors</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          {site.name} uses infrastructure and channel providers to operate the service. The exact set depends on your deployment (for example Vercel vs Render vs Railway for compute). This list is illustrative of providers the product is designed to use. It is not a certification of SOC 2 or similar.
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">Purpose</th>
                <th className="py-3 pr-4">Data processed</th>
                <th className="py-3">Privacy policy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-slate-100 align-top">
                  <td className="py-4 pr-4 font-medium">{row.name}</td>
                  <td className="py-4 pr-4 text-slate-700">{row.purpose}</td>
                  <td className="py-4 pr-4 text-slate-700">{row.data}</td>
                  <td className="py-4">
                    <a className="text-accent-indigo hover:underline" href={row.href} rel="noopener noreferrer">
                      Privacy policy
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Last reviewed: <span className="placeholder-note">{site.effectiveDate}</span>. Privacy contact:{' '}
          <span className="placeholder-note">{site.privacyEmail}</span>.
        </p>
      </div>
    </article>
  );
}
