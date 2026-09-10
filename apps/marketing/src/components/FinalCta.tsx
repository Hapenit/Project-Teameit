import Link from 'next/link';
import { appSignupUrl } from '@/lib/site';

export function FinalCta({
  title = 'Ready to bring your channels into one workspace?',
  body = 'Create a TEAMeIT workspace to publish, converse, campaign, and automate from a single tenant.',
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="section bg-navy-900 text-white">
      <div className="container-page text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={appSignupUrl} className="btn-primary">
            Start Free
          </a>
          <Link href="/contact" className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10">
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
