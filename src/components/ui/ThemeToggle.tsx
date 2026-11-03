'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const THEME_KEY = 'epic_theme_v2';

/** Inline script for <head>: applies the saved theme before first paint. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export function ThemeToggle({ className, variant = 'icon' }: { className?: string; variant?: 'icon' | 'text' }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme');
    setTheme(t === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  if (variant === 'text') {
    return (
      <button type="button" onClick={toggle} className={cn('inline-flex items-center gap-2 hover:text-fg', className)}>
        {theme === 'dark' ? <Sun className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />}
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex h-12 w-12 items-center justify-center border border-line bg-surface-2 transition-colors hover:border-line-strong',
        className
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px] text-brand" strokeWidth={1.75} />
      ) : (
        <Moon className="h-[18px] w-[18px] text-fg" strokeWidth={1.75} />
      )}
    </button>
  );
}
