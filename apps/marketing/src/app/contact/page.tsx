import { ContactForm } from '@/components/ContactForm';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Contact',
  description: 'Contact TEAMeIT for demos, sales, and support. Business email and a validated contact form.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy-900 py-16 text-white">
        <div className="container-page">
          <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Book a demo, ask about packaging, or reach support. We do not ask for Facebook, Instagram, LinkedIn, or WhatsApp passwords on this form.</p>
        </div>
      </section>
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Business email</h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>
                Support:{' '}
                <a className="font-medium text-accent-indigo" href={`mailto:${site.supportEmail}`}>
                  {site.supportEmail}
                </a>
              </li>
              <li>
                Sales:{' '}
                <a className="font-medium text-accent-indigo" href={`mailto:${site.salesEmail}`}>
                  {site.salesEmail}
                </a>
              </li>
              <li>
                Privacy: <span className="placeholder-note">{site.privacyEmail}</span>
              </li>
            </ul>
            <p className="mt-6 text-sm text-slate-600">
              {site.name}
              <br />
              {site.legalName}
              <br />
              {site.address}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="mb-4 text-xl font-semibold">Send a message</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
