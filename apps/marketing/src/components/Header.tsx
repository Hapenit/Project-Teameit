'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { appLoginUrl, appSignupUrl, nav, site } from '@/lib/site';

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/95 text-white backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple text-sm">
            T
          </span>
          <span>{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} className={`text-sm transition-colors hover:text-white ${pathname === item.href ? 'font-semibold text-white' : 'text-slate-200'}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href={appLoginUrl} className="text-sm font-medium text-slate-200 hover:text-white">
            Login
          </a>
          <a href={appSignupUrl} className="btn-primary !py-2">
            Start Free
          </a>
        </div>

        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-white/10 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} className={`py-1 transition-colors hover:text-white ${pathname === item.href ? 'font-semibold text-white' : 'text-slate-200'}`} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <a href={appLoginUrl} className="py-1 text-slate-200">
              Login
            </a>
            <a href={appSignupUrl} className="btn-primary mt-2 w-full">
              Start Free
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
