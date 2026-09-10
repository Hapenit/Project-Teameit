import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

const paths = [
  '/',
  '/about',
  '/features',
  '/pricing',
  '/contact',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/cookies',
  '/data-deletion',
  '/subprocessors',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${site.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
