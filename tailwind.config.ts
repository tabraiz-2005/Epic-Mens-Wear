import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  // Hover effects only on devices that can hover, so phones open a product on the first tap.
  future: { hoverOnlyWhenSupported: true },
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        line: v('line'),
        'line-strong': v('line-strong'),
        fg: v('fg'),
        muted: v('muted'),
        subtle: v('subtle'),
        brand: v('brand'),
        'brand-ink': v('brand-ink'),
        gold: v('gold'),
        danger: v('danger'),
        success: v('success'),
        warning: v('warning'),
      },
      fontFamily: {
        display: ['"Jost Variable"', 'Jost', 'Futura', 'Century Gothic', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.22em',
        wide2: '0.3em',
        logo: '0.42em',
      },
      maxWidth: {
        site: '1860px',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        rise: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fadeIn .25s ease-out both',
        'slide-in': 'slideIn .35s cubic-bezier(.2,.8,.2,1) both',
        rise: 'rise .5s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
