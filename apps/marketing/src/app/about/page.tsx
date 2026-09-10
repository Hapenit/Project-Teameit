import Link from 'next/link';
import { FinalCta } from '@/components/FinalCta';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'About',
  description: 'Mission, vision, and the problem TEAMeIT is built to solve for businesses, agencies, and teams.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy-900 py-16 text-white">
        <div className="container-page max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">About {site.name}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">One workspace for omnichannel work</h1>
        </div>
      </section>
      <section className="section">
        <div className="container-page prose-legal max-w-3xl">
          <h2>Mission</h2>
          <p>
            Help businesses, marketing agencies, and internal teams manage social publishing, conversations, campaigns, analytics, and automation from a single tenant-aware product—without collecting client passwords for Facebook, Instagram, or other networks.
          </p>
          <h2>Vision</h2>
          <p>
            A trustworthy operations layer where every connected channel is authorized through OAuth or official APIs, activity is auditable, and customers can disconnect integrations and request deletion of their data.
          </p>
          <h2>The problem we solve</h2>
          <p>
            Teams still split publishing, inbox replies, SMS, WhatsApp, email, and reporting across native apps and spreadsheets. Credentials get shared in chat. There is no shared calendar, no tenant boundary for agencies, and no audit trail. TEAMeIT centralizes those workflows in a workspace with role-aware members.
          </p>
          <h2>Company</h2>
          <p>
            Legal entity: <span className="placeholder-note">{site.legalName}</span>
          </p>
          <p>
            Registered address: <span className="placeholder-note">{site.address}</span>
          </p>
          <h2>Team</h2>
          <p>
            <span className="placeholder-note">Team bios and photos are placeholders</span> until official company information is published.
          </p>
          <ul>
            <li>[Founder / CEO — placeholder]</li>
            <li>[Head of Product — placeholder]</li>
            <li>[Head of Engineering — placeholder]</li>
          </ul>
          <p className="mt-8">
            Questions about partnerships or the product?{' '}
            <Link href="/contact">Contact us</Link> or email{' '}
            <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
          </p>
        </div>
      </section>
      <FinalCta title="Talk with TEAMeIT" body="Book a demo or create a workspace when you are ready." />
    </>
  );
}
