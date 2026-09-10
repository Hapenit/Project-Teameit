import { PricingTable } from '@/components/PricingTable';
import { pageMetadata } from '@/lib/seo';
import { appSignupUrl } from '@/lib/site';
import Link from 'next/link';

export const metadata = pageMetadata({
  title: 'Pricing',
  description: 'TEAMeIT plan packaging, illustrative monthly and yearly prices, feature comparison, and enterprise contact sales.',
  path: '/pricing',
});

export default function PricingPage() {
  return (
    <>
      <section className="bg-navy-900 py-16 text-white">
        <div className="container-page max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
          <p className="mt-4 text-slate-300">
            Create an account to use the product. Commercial checkout is not enabled in the current deployment. Numbers on this page are packaging placeholders, not a guarantee of billed amounts or enforced quotas.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container-page">
          <PricingTable />
          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
            <p>
              Ready to try the product?{' '}
              <a className="font-medium text-accent-indigo hover:underline" href={appSignupUrl}>
                Start Free
              </a>
              . For Enterprise, volume, or a demo,{' '}
              <Link className="font-medium text-accent-indigo hover:underline" href="/contact">
                contact sales
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
