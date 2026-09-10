'use client';

import { useState } from 'react';
import { site } from '@/lib/site';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function ContactForm({ intent = 'contact' }: { intent?: 'contact' | 'deletion' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMessage, setServerMessage] = useState('');

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!emailOk(email)) next.email = 'Enter a valid email address.';
    if (!message.trim() || message.trim().length < 10) next.message = 'Please provide at least 10 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setStatus('error');
      setServerMessage('Please correct the highlighted fields.');
      return;
    }
    setStatus('submitting');
    setServerMessage('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, message, intent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setServerMessage(
          data.error ||
            `We could not send this form. Email ${intent === 'deletion' ? site.deletionEmail : site.supportEmail} instead.`,
        );
        return;
      }
      setStatus('success');
      setServerMessage(data.message || 'Thanks. We received your message.');
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
      setErrors({});
    } catch {
      setStatus('error');
      setServerMessage(`Network error. Please email ${site.supportEmail}.`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="company" className="text-sm font-medium">
          Company
        </label>
        <input
          id="company"
          name="company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium">
          {intent === 'deletion' ? 'Deletion request details' : 'Message'}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && <p id="message-error" className="mt-1 text-xs text-red-600">{errors.message}</p>}
      </div>
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send'}
      </button>
      {status === 'success' && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {serverMessage}
        </p>
      )}
      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {serverMessage}
        </p>
      )}
    </form>
  );
}
