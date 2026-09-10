import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import Link from 'next/link';

export const metadata = pageMetadata({
  title: 'Cookie Policy',
  description: 'How TEAMeIT uses essential, authentication, and analytics cookies, and how to manage them.',
  path: '/cookies',
});

export default function CookiesPage() {
  return (
    <article className="section">
      <div className="container-page prose-legal max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Cookie Policy</h1>
        <p className="mt-4 text-sm text-slate-500">
          Effective date: <span className="placeholder-note">{site.effectiveDate}</span>
        </p>
        <p>
          This policy explains how {site.name} uses cookies and similar technologies on the public website and in the application.
        </p>

        <h2>Essential cookies</h2>
        <p>
          These cookies are required for the site to work: load balancing, CSRF protection if enabled, cookie-consent storage if we add a banner, and remembering UI state such as the pricing period toggle (which may use local storage instead of a cookie). You can block cookies in your browser, but core pages may still function without non-essential cookies.
        </p>

        <h2>Authentication and session cookies</h2>
        <p>
          When you sign in to the TEAMeIT application, the authentication provider (Supabase Auth) sets session cookies or stores session tokens in the browser so you remain signed in. Those cookies are necessary to keep you authenticated and are not used for advertising. Clearing them signs you out.
        </p>

        <h2>Analytics cookies</h2>
        <p>
          This marketing site does not currently set a named third-party analytics cookie (for example Google Analytics) unless one is added later and this policy is updated. If we enable analytics, cookies would be used to understand aggregated traffic (pages viewed, approximate geography, device type) so we can improve the site. We will not use analytics cookies to sell your identity.
        </p>

        <h2>How to manage cookies</h2>
        <ul>
          <li>Browser settings: Chrome, Safari, Firefox, and Edge each provide cookie blocking, deletion, and site-level controls.</li>
          <li>Sign out of the TEAMeIT application to end auth sessions.</li>
          <li>Disconnect social integrations in the application; that does not rely on marketing-site cookies.</li>
        </ul>
        <p>
          For privacy questions see the <Link href="/privacy">Privacy Policy</Link> or email <span className="placeholder-note">{site.privacyEmail}</span>.
        </p>
      </div>
    </article>
  );
}
