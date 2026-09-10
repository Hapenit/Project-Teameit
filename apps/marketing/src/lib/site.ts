export const site = {
  name: 'TEAMeIT',
  tagline: 'Manage, automate, and grow your digital presence',
  description:
    'TEAMeIT is an omnichannel social media marketing and automation platform for businesses, agencies, and teams. Publish, converse, campaign, analyze, and automate across Facebook, Instagram, LinkedIn, WhatsApp, SMS, and email.',
  legalName: '[Legal company name — placeholder]',
  address: '[Registered business address — placeholder]',
  supportEmail: 'support@teameit.com',
  salesEmail: 'sales@teameit.com',
  privacyEmail: '[privacy contact email — placeholder]',
  dpoEmail: '[data protection officer email — placeholder, if applicable]',
  deletionEmail: '[data deletion request email — placeholder]',
  effectiveDate: '[Effective date — placeholder]',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://teameit.com').replace(/\/$/, ''),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || 'https://app.teameit.com').replace(/\/$/, ''),
} as const;

export const appLoginUrl = `${site.appUrl}/login`;
export const appSignupUrl = `${site.appUrl}/signup`;

export const nav = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const footerLegal = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/data-deletion', label: 'Data Deletion' },
  { href: '/subprocessors', label: 'Subprocessors' },
] as const;

export const footerProduct = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Login' },
  { href: '/signup', label: 'Sign Up' },
] as const;
