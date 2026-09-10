import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import Link from 'next/link';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How TEAMeIT collects, uses, stores, and deletes account, tenant, OAuth, and provider data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <article className="section">
      <div className="container-page prose-legal max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">
          Effective date: <span className="placeholder-note">{site.effectiveDate}</span>
        </p>
        <p>
          This policy describes how {site.name} (“TEAMeIT”, “we”, “us”) processes personal and organizational data when you use the public website and the TEAMeIT application. Controller identity: <span className="placeholder-note">{site.legalName}</span>, <span className="placeholder-note">{site.address}</span>.
        </p>

        <h2>1. Information we collect from users and organizations</h2>
        <p>Depending on how you use TEAMeIT, we may collect:</p>
        <ul>
          <li>Account identifiers: name, email address, password hashes (handled by the authentication provider), and profile fields you submit.</li>
          <li>Organization (tenant) information: workspace name, membership, roles, and settings.</li>
          <li>Usage and device data: IP address, browser type, approximate location derived from IP, and diagnostic logs.</li>
          <li>Support and form submissions: name, email, company, and message content you send via Contact or Data Deletion forms.</li>
          <li>Billing records if Stripe is configured: customer identifiers, subscription status, and invoices processed by Stripe. We do not store full payment card numbers on TEAMeIT servers.</li>
        </ul>

        <h2>2. Account and tenant information</h2>
        <p>
          TEAMeIT is multi-tenant. Customer content, integrations, conversations, campaigns, and logs are associated with a tenant. Administrators control membership. We use tenant identifiers to authorize access and to isolate data between organizations.
        </p>

        <h2>3. Social account connection data</h2>
        <p>
          When a customer connects Facebook, Instagram, LinkedIn, WhatsApp, SMS, email, or similar services, we store the connection metadata needed to operate the product: provider name, account or page identifiers, display names, connection status, and related configuration (for example SMTP host settings supplied by the customer).
        </p>
        <p>
          <strong>TEAMeIT does not collect or store client Facebook or Instagram passwords.</strong> Social accounts are connected using OAuth authorization (or the provider’s equivalent official authorization). Users can disconnect integrations in the application and can request deletion of their data as described in this policy and on the{' '}
          <Link href="/data-deletion">Data Deletion</Link> page.
        </p>

        <h2>4. OAuth access tokens and provider account identifiers</h2>
        <p>
          After OAuth, providers issue access tokens (and sometimes refresh tokens). TEAMeIT stores those tokens and provider account identifiers so the product can publish, read conversations, send campaign messages, or fetch analytics that the customer authorized. Tokens are credentials. They are used only to deliver the features the customer enabled. They are not sold. Token handling should be encrypted at rest in production deployments; customers should verify their hosting configuration.
        </p>

        <h2>5. Facebook, Instagram, LinkedIn, WhatsApp, SMS, email, and analytics data</h2>
        <p>To provide authorized features we may process:</p>
        <ul>
          <li>Facebook and Instagram: Page or professional account IDs, posts you create, comments, inbound messages, media references, and webhook events the customer subscribed to.</li>
          <li>LinkedIn: organization or member identifiers permitted by the LinkedIn app scopes, and content you publish through TEAMeIT.</li>
          <li>WhatsApp: phone numbers / WhatsApp Business Account IDs, template and session messages, and delivery status events.</li>
          <li>SMS: destination numbers, message bodies, and Twilio (or other SMS provider) status callbacks.</li>
          <li>Email: addresses, subjects, bodies, and SMTP/IMAP configuration the customer supplies.</li>
          <li>Analytics: aggregates derived from TEAMeIT-stored messages, conversations, campaigns, and, where enabled, synced advertising metrics.</li>
        </ul>
        <p>
          Provider data is used only to deliver the features authorized by the customer. We do not use customer social content to train public generative models.
        </p>

        <h2>6. How data is used</h2>
        <ul>
          <li>Provide, maintain, and secure the TEAMeIT service.</li>
          <li>Authenticate users and enforce tenant permissions.</li>
          <li>Publish content, route inbox messages, run campaigns, execute automations, and display reports the customer requests.</li>
          <li>Communicate about the service (transactional email, security notices).</li>
          <li>Comply with law and respond to valid legal process.</li>
        </ul>

        <h2>7. How data is stored and protected</h2>
        <p>
          Application data is stored with our hosting and database subprocessors (see <Link href="/subprocessors">Subprocessors</Link>). Access to production systems is restricted to authorized personnel. We use HTTPS for public URLs. No API keys, OAuth client secrets, access tokens, or database service-role keys are embedded in this marketing frontend.
        </p>

        <h2>8. Data retention and deletion</h2>
        <p>
          We retain account, tenant, and provider-connected data for as long as the workspace remains active and as needed to provide the service, resolve disputes, and meet legal obligations. After a validated deletion request, we delete or de-identify personal data within <strong>30 days</strong>, except where retention is required by law or for security logs with a limited retention period. Backups may persist for a short additional window until rotated.
        </p>

        <h2>9. Subprocessors and hosting providers</h2>
        <p>
          We use infrastructure and channel providers listed on the <Link href="/subprocessors">Subprocessors</Link> page, including database/auth hosting, application hosting, Meta, LinkedIn, Twilio, Stripe, and customer-configured email transport.
        </p>

        <h2>10. Cookies and analytics</h2>
        <p>
          The marketing site uses essential cookies as described in the <Link href="/cookies">Cookie Policy</Link>. Authentication cookies are set by the TEAMeIT application when you sign in. We do not currently claim a specific third-party analytics vendor on this site unless one is later configured and disclosed.
        </p>

        <h2>11. User rights and choices</h2>
        <p>
          Subject to applicable law (including GDPR/UK GDPR and similar frameworks where they apply), you may request access, correction, deletion, restriction, portability, or objection to certain processing. You may also lodge a complaint with a supervisory authority. To exercise rights, email <span className="placeholder-note">{site.privacyEmail}</span>.
        </p>

        <h2>12. Disconnecting social accounts</h2>
        <p>
          Workspace administrators can disconnect integrations in the TEAMeIT application. Disconnecting stops new API use of that connection. Historical messages or posts already stored in TEAMeIT may remain until you delete them or request account/provider-data deletion.
        </p>

        <h2>13. Children’s privacy</h2>
        <p>
          TEAMeIT is a business service. It is not directed to children under 16 (or the age required in your jurisdiction). We do not knowingly collect personal data from children. If you believe we have, contact us and we will delete it.
        </p>

        <h2>14. International data transfers</h2>
        <p>
          Data may be processed in the countries where our subprocessors operate (including the United States and other regions). Where required, we rely on appropriate transfer mechanisms such as Standard Contractual Clauses. Confirm the hosting regions used in your deployment with <span className="placeholder-note">{site.privacyEmail}</span>.
        </p>

        <h2>15. Policy updates</h2>
        <p>
          We may update this policy. The effective date above will change. Material changes will be posted on this page. Continued use after the effective date constitutes acceptance where permitted by law.
        </p>

        <h2>16. Contact information</h2>
        <p>
          Privacy: <span className="placeholder-note">{site.privacyEmail}</span>
          <br />
          Data protection officer (if applicable): <span className="placeholder-note">{site.dpoEmail}</span>
          <br />
          Support: <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
          <br />
          Postal: <span className="placeholder-note">{site.address}</span>
        </p>
      </div>
    </article>
  );
}
