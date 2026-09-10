'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is TEAMeIT?',
    a: 'TEAMeIT is a multi-tenant workspace for social publishing, inbox conversations, campaigns, automation, analytics, and team administration. It is built for businesses, marketing agencies, and internal teams.',
  },
  {
    q: 'Which channels can I connect?',
    a: 'The product includes connection flows for Facebook, Instagram, LinkedIn, WhatsApp, SMS (Twilio), and email (customer-configured SMTP). Provider accounts are connected with OAuth or the provider’s official APIs. TEAMeIT does not collect Facebook or Instagram passwords.',
  },
  {
    q: 'Is there a free trial?',
    a: 'You can create an account in the TEAMeIT application at no charge to explore the workspace. Paid plan checkout is not enabled in the current deployment; contact sales for commercial terms.',
  },
  {
    q: 'Can I disconnect social accounts?',
    a: 'Yes. Workspace administrators can disconnect integrations from the application. You may also request deletion of account and provider data using the Data Deletion page.',
  },
  {
    q: 'Do you store my social passwords?',
    a: 'No. Facebook, Instagram, LinkedIn, and similar networks are authorized through OAuth. TEAMeIT stores provider-issued tokens and account identifiers needed to operate the features you enable, not client passwords for those networks.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200">
      {faqs.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={expanded}
              aria-controls={`faq-panel-${i}`}
              id={`faq-trigger-${i}`}
              onClick={() => setOpen(expanded ? null : i)}
            >
              <span className="font-medium text-navy-900">{item.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {expanded && (
              <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-trigger-${i}`} className="px-5 pb-5">
                <p className="text-sm leading-6 text-slate-600">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
