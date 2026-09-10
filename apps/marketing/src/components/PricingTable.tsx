'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { appSignupUrl } from '@/lib/site';

type Cell = boolean | string;

const rows: { feature: string; starter: Cell; growth: Cell; enterprise: Cell }[] = [
  { feature: 'Workspaces / tenants', starter: '1', growth: 'Multiple', enterprise: 'Custom' },
  { feature: 'Team members', starter: 'Up to 3', growth: 'Up to 15', enterprise: 'Unlimited*' },
  { feature: 'Connected social / messaging accounts', starter: 'Up to 5', growth: 'Up to 25', enterprise: 'Custom' },
  { feature: 'Social publishing drafts & calendar UI', starter: true, growth: true, enterprise: true },
  { feature: 'Facebook, Instagram, LinkedIn connections', starter: true, growth: true, enterprise: true },
  { feature: 'Unified inbox', starter: true, growth: true, enterprise: true },
  { feature: 'Email campaigns', starter: true, growth: true, enterprise: true },
  { feature: 'WhatsApp & SMS campaign tools', starter: false, growth: true, enterprise: true },
  { feature: 'Workflow automation', starter: 'Basic', growth: true, enterprise: true },
  { feature: 'Analytics aggregates & reports', starter: true, growth: true, enterprise: true },
  { feature: 'Audit logs', starter: false, growth: true, enterprise: true },
  { feature: 'Billing portal (when Stripe is configured)', starter: true, growth: true, enterprise: true },
  { feature: 'Priority support', starter: false, growth: false, enterprise: true },
];

function CellView({ value }: { value: Cell }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Included" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Not included" />;
  return <span className="text-sm text-slate-700">{value}</span>;
}

export function PricingTable({ compact = false }: { compact?: boolean }) {
  const [yearly, setYearly] = useState(true);

  const starter = yearly ? 29 : 35;
  const growth = yearly ? 79 : 99;

  return (
    <div>
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm" role="group" aria-label="Billing period">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 ${!yearly ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 ${yearly ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
          >
            Yearly
          </button>
        </div>
        <p className="max-w-2xl text-center text-sm text-slate-600">
          <span className="placeholder-note">Placeholder pricing</span>{' '}
          Stripe checkout is not enabled in the current product deployment. Amounts below are illustrative packaging, not live billed rates. Usage limits are not currently enforced in software.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold">Starter</h3>
          <p className="mt-1 text-sm text-slate-600">Small teams getting channels into one workspace.</p>
          <p className="mt-6 text-4xl font-semibold">
            ${starter}
            <span className="text-base font-normal text-slate-500">/mo</span>
          </p>
          <p className="text-xs text-slate-500">{yearly ? 'Billed yearly (placeholder)' : 'Billed monthly (placeholder)'}</p>
          <a href={appSignupUrl} className="btn-secondary mt-6 w-full">
            Start Free
          </a>
        </article>
        <article className="rounded-2xl border-2 border-accent-indigo p-6 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-indigo">For growing teams</p>
          <h3 className="mt-1 text-lg font-semibold">Growth</h3>
          <p className="mt-1 text-sm text-slate-600">Agencies and growing teams with campaigns and automation.</p>
          <p className="mt-6 text-4xl font-semibold">
            ${growth}
            <span className="text-base font-normal text-slate-500">/mo</span>
          </p>
          <p className="text-xs text-slate-500">{yearly ? 'Billed yearly (placeholder)' : 'Billed monthly (placeholder)'}</p>
          <a href={appSignupUrl} className="btn-primary mt-6 w-full">
            Start Free
          </a>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-navy-900 p-6 text-white">
          <h3 className="text-lg font-semibold">Enterprise</h3>
          <p className="mt-1 text-sm text-slate-300">Custom tenants, volume, and procurement.</p>
          <p className="mt-6 text-4xl font-semibold">Custom</p>
          <p className="text-xs text-slate-400">Quoted by sales</p>
          <Link href="/contact" className="btn-secondary mt-6 w-full">
            Contact sales
          </Link>
        </article>
      </div>

      {!compact && (
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="mb-4 text-left text-base font-semibold text-navy-900">Feature comparison</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 font-semibold">Capability</th>
                <th className="px-2 py-3 text-center font-semibold">Starter</th>
                <th className="px-2 py-3 text-center font-semibold">Growth</th>
                <th className="px-2 py-3 text-center font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-700">{row.feature}</td>
                  <td className="px-2 py-3 text-center">
                    <CellView value={row.starter} />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <CellView value={row.growth} />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <CellView value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">*Unlimited means not capped in the packaging description; the current product does not enforce these entitlements automatically.</p>
        </div>
      )}
    </div>
  );
}
