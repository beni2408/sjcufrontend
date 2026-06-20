/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        sjcu: {
          dark:           'rgb(var(--sjcu-dark) / <alpha-value>)',
          navy:           'rgb(var(--sjcu-navy) / <alpha-value>)',
          'navy-2':       'rgb(var(--sjcu-navy-2) / <alpha-value>)',
          card:           'rgb(var(--sjcu-card) / <alpha-value>)',
          'card-2':       'rgb(var(--sjcu-card-2) / <alpha-value>)',
          border:         'rgb(var(--sjcu-border) / <alpha-value>)',
          purple:         'rgb(var(--sjcu-purple) / <alpha-value>)',
          'purple-light': 'rgb(var(--sjcu-purple-light) / <alpha-value>)',
          'purple-dim':   'rgb(var(--sjcu-purple-dim) / <alpha-value>)',
          violet:         'rgb(var(--sjcu-violet) / <alpha-value>)',
          accent:         'rgb(var(--sjcu-accent) / <alpha-value>)',
          'accent-2':     'rgb(var(--sjcu-accent-2) / <alpha-value>)',
          gold:           'rgb(var(--sjcu-gold) / <alpha-value>)',
          'text-primary':   'rgb(var(--sjcu-text-primary) / <alpha-value>)',
          'text-secondary': 'rgb(var(--sjcu-text-secondary) / <alpha-value>)',
          'text-muted':     'rgb(var(--sjcu-text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, #1e1b4b 0%, #05050f 60%)',
        'purple-glow': 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-up':      'fadeUp 0.8s ease-out forwards',
        'float':        'float 6s ease-in-out infinite',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'modal-spring':    'modalSpring 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'ring-pulse':      'ringPulse 1.8s ease-out infinite',
        'glow-pulse':      'glowPulse 1.4s ease-in-out infinite',
        'gradient-flow':   'gradientFlow 5s ease-in-out infinite',
        'shimmer-sweep':   'shimmerSweep 0.65s ease-out forwards',
        'focus-ring-pop':  'focusRingPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'icon-spring':     'iconSpring 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scan-line':       'scanLine 0.75s ease-out forwards',
        'count-up':        'countUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        modalSpring: {
          '0%':   { opacity: '0', transform: 'scale(0.88) translateY(22px)' },
          '60%':  { opacity: '1', transform: 'scale(1.03) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        ringPulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(124,58,237,0.38), 0 0 0 0 rgba(124,58,237,0.14)' },
          '100%': { boxShadow: '0 0 0 12px rgba(124,58,237,0), 0 0 0 26px rgba(124,58,237,0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.5)' },
          '50%':      { boxShadow: '0 0 0 9px rgba(124,58,237,0)' },
        },
        gradientFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        shimmerSweep: {
          '0%':   { transform: 'translateX(-110%)' },
          '100%': { transform: 'translateX(110%)' },
        },
        focusRingPop: {
          '0%':   { boxShadow: '0 0 0 0 rgba(124,58,237,0.6)' },
          '60%':  { boxShadow: '0 0 0 5px rgba(124,58,237,0.25)' },
          '100%': { boxShadow: '0 0 0 3px rgba(124,58,237,0.18)' },
        },
        iconSpring: {
          '0%':   { transform: 'translateY(0) scale(1)' },
          '35%':  { transform: 'translateY(-5px) scale(1.18)' },
          '65%':  { transform: 'translateY(-1px) scale(0.96)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        scanLine: {
          '0%':   { left: '-60%' },
          '100%': { left: '160%' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.85)' },
          '70%':  { transform: 'translateY(-3px) scale(1.05)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      boxShadow: {
        'purple-glow': '0 0 40px rgba(124, 58, 237, 0.3)',
        'purple-glow-lg': '0 0 80px rgba(124, 58, 237, 0.4)',
        glass: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
}
