/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        dash: {
          bg:     '#0B1220',
          panel:  '#152035',
          border: '#1E293B',
          text:   '#E2E8F0',
          muted:  '#94A3B8',
          accent: '#3B82F6',
        },
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        glow: '0 0 16px rgba(59,130,246,0.18)',
        'glow-sm': '0 0 8px rgba(59,130,246,0.12)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
