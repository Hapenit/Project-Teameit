import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import Link from 'next/link';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'TEAMeIT terms covering accounts, tenants, acceptable use, content, billing, liability, and governing law.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <article className="section">
      <div className="container-page prose-legal max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-500">
          Effective date: <span className="placeholder-note">{site.effectiveDate}</span>
        </p>
        <p>
          These terms govern use of the TEAMeIT websites and application provided by <span className="placeholder-note">{site.legalName}</span> (“TEAMeIT”, “we”). By creating an account or using the service you agree to these terms.
        </p>

        <h2>1. Account registration</h2>
        <p>
          You must provide accurate registration information and keep credentials confidential. You are responsible for activity under your account. The service is intended for organizational use. You must be able to form a binding contract.
        </p>

        <h2>2. Tenant and team responsibilities</h2>
        <p>
          TEAMeIT workspaces (tenants) are administered by owners and admins. They are responsible for inviting the right members, assigning roles, connecting only accounts the organization is authorized to use, and configuring integrations lawfully (including WhatsApp templates, SMS consent, and email anti-spam rules).
        </p>

        <h2>3. Acceptable use</h2>
        <p>You may not:</p>
        <ul>
          <li>Violate law, third-party rights, or provider platform policies (Meta, LinkedIn, Twilio, email providers, and others).</li>
          <li>Attempt unauthorized access, probe, or disrupt the service.</li>
          <li>Upload malware or content that is unlawful, harassing, or deceptive.</li>
          <li>Send spam or unsolicited marketing in breach of applicable consent rules.</li>
          <li>Share Facebook, Instagram, or similar passwords with TEAMeIT; connections must use OAuth.</li>
          <li>Resell the service or exceed documented API or product limits in a way that harms other tenants.</li>
        </ul>

        <h2>4. Customer content ownership</h2>
        <p>
          You retain ownership of content you submit (posts, media, messages, CRM records, workflows). You grant TEAMeIT a limited license to host, process, transmit, and display that content solely to provide the service. We do not claim ownership of your social posts or customer lists.
        </p>

        <h2>5. Social provider permissions</h2>
        <p>
          Channel features require you to authorize TEAMeIT with the relevant provider. Scopes and data access are controlled by that provider. Provider outages, policy changes, app review status, or revoked tokens may reduce functionality. TEAMeIT is not the provider of Facebook, Instagram, LinkedIn, WhatsApp, SMS, or email networks.
        </p>

        <h2>6. Billing and subscriptions</h2>
        <p>
          If paid plans are enabled, fees, taxes, and renewals will be presented at checkout (typically via Stripe). The current deployment may not have self-serve checkout enabled; in that case commercial terms are agreed in writing with sales. Fees are non-refundable except as required by law or a written order. You remain responsible for provider pass-through costs (for example Twilio usage).
        </p>

        <h2>7. Suspension and termination</h2>
        <p>
          We may suspend or terminate access for unpaid invoices (when billing applies), security risk, or material breach. You may stop using the service and request deletion as described in the <Link href="/privacy">Privacy Policy</Link> and <Link href="/data-deletion">Data Deletion</Link> page. Upon termination, your license to the software ends. We may retain limited records as required by law.
        </p>

        <h2>8. Third-party services</h2>
        <p>
          The service interoperates with subprocessors and social networks listed on the <Link href="/subprocessors">Subprocessors</Link> page. Their terms apply to your use of those networks. We are not responsible for third-party acts or omissions.
        </p>

        <h2>9. Availability disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS”. We do not warrant uninterrupted or error-free operation, successful delivery of every message or post, or that provider APIs will remain available. Scheduled workers, webhooks, and OAuth apps must be correctly configured in each deployment.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, TEAMeIT AND ITS SUPPLIERS ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL. OUR AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF THE SERVICE IS LIMITED TO THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM, OR ONE HUNDRED U.S. DOLLARS IF YOU HAVE NOT PAID. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of <span className="placeholder-note">[Governing law / jurisdiction — placeholder]</span>, excluding conflict-of-law rules. Courts in that jurisdiction have exclusive venue, except where applicable consumer law requires otherwise.
        </p>

        <h2>12. Contact</h2>
        <p>
          {site.name} / <span className="placeholder-note">{site.legalName}</span>
          <br />
          <span className="placeholder-note">{site.address}</span>
          <br />
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>
      </div>
    </article>
  );
}
