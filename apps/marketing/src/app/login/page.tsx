import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { appLoginUrl, appSignupUrl } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Login',
  description: 'Sign in to the TEAMeIT application. Social networks connect later via OAuth—never by sharing provider passwords here.',
  path: '/login',
});

export default function LoginPage() {
  return (
    <section className="section">
      <div className="container-page max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight">Log in to TEAMeIT</h1>
        <p className="mt-4 text-slate-600">
          Account sign-in happens in the TEAMeIT application using your TEAMeIT email and password (or the authentication method configured there). This marketing site does not collect Facebook, Instagram, LinkedIn, WhatsApp, or other client provider passwords.
        </p>
        <p className="mt-4 text-slate-600">
          After you are in a workspace, social and messaging accounts are connected securely through OAuth or the provider’s official authorization flow. TEAMeIT receives access tokens and account identifiers, not your network passwords.
        </p>
        <a href={appLoginUrl} className="btn-primary mt-8">
          Continue to application login
        </a>
        <p className="mt-6 text-sm text-slate-600">
          Need an account?{' '}
          <Link href="/signup" className="font-medium text-accent-indigo hover:underline">
            Sign up
          </Link>
          {' · '}
          <a href={appSignupUrl} className="font-medium text-accent-indigo hover:underline">
            Open registration
          </a>
        </p>
      </div>
    </section>
  );
}
