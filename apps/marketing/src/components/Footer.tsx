import Link from 'next/link';
import { footerLegal, footerProduct, site } from '@/lib/site';

export function Footer() {
  return (
    <footer className="border-t border-navy-900/10 bg-navy-950 text-slate-300">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p className="text-lg font-semibold text-white">{site.name}</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Omnichannel social media marketing and automation for businesses, agencies, and teams.
          </p>
          <p className="mt-4 text-sm">
            <span className="text-slate-500">Company</span>
            <br />
            {site.legalName}
          </p>
          <p className="mt-3 text-sm">
            Support:{' '}
            <a className="text-white underline-offset-2 hover:underline" href={`mailto:${site.supportEmail}`}>
              {site.supportEmail}
            </a>
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Product</p>
          <ul className="mt-4 space-y-2 text-sm">
            {footerProduct.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Legal</p>
          <ul className="mt-4 space-y-2 text-sm">
            {footerLegal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Contact</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact form
              </Link>
            </li>
            <li>
              <a href={`mailto:${site.salesEmail}`} className="hover:text-white">
                {site.salesEmail}
              </a>
            </li>
            <li className="text-slate-500">
              Address
              <br />
              {site.address}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {site.name}. {site.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
