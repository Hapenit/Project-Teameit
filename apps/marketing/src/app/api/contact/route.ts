import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Payload = {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  intent?: string;
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const company = String(body.company || '').trim();
  const message = String(body.message || '').trim();
  const intent = body.intent === 'deletion' ? 'deletion' : 'contact';

  if (!name || !email || !isEmail(email) || message.length < 10) {
    return NextResponse.json({ error: 'Name, valid email, and a message of at least 10 characters are required.' }, { status: 400 });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, message, intent, source: 'teameit-marketing' }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Delivery failed. Please email support@teameit.com.' }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      message: intent === 'deletion' ? 'Deletion request submitted. We typically process requests within 30 days.' : 'Message sent. We will reply to the email you provided.',
    });
  }

  return NextResponse.json(
    {
      error:
        'Form delivery is not configured on this site. Email support@teameit.com (or the placeholder privacy email on the Data Deletion page) with your request.',
    },
    { status: 503 },
  );
}
