import type { Metadata } from 'next';
import { site } from './site';

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${site.siteUrl}${opts.path}`;
  const title = opts.path === '/' ? `${site.name} | ${opts.title}` : `${opts.title} | ${site.name}`;
  return {
    title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description: opts.description,
      siteName: site.name,
      locale: 'en_US',
      images: [{ url: `${site.siteUrl}/opengraph-image`, width: 1200, height: 630, alt: `${site.name} — ${opts.title}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: opts.description,
      images: [`${site.siteUrl}/opengraph-image`],
    },
  };
}
