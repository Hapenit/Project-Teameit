import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { appSignupUrl } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Sign up',
  description: 'Create a TEAMeIT account. Registration happens in the application. Review Terms of Service and Privacy Policy first.',
  path: '/signup',
});

export default function SignupPage() {
  return (
    <section className="section">
      <div className="container-page max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight">Create your TEAMeIT account</h1>
        <p className="mt-4 text-slate-600">
          Registration is handled by the TEAMeIT application. You will create a TEAMeIT user, then a workspace (tenant). Connecting Facebook, Instagram, LinkedIn, WhatsApp, SMS, or email happens later through OAuth or provider APIs—not by typing those passwords into this website.
        </p>
        <a href={appSignupUrl} className="btn-primary mt-8">
          Continue to application registration
        </a>
        <p className="mt-6 text-sm text-slate-600">
          By creating an account you agree to the{' '}
          <Link href="/terms" className="font-medium text-accent-indigo hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-medium text-accent-indigo hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-accent-indigo hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
