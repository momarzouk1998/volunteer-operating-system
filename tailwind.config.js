/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00469b',
          dark: '#00306f',
          light: '#d8e2ff',
          container: '#00469b',
          'on-container': '#99b9ff',
        },
        navy: {
          deep: '#0d3b66',
          cobalt: '#1e40af',
          royal: '#00469b',
        },
        sky: {
          vibrant: '#0ea5e9',
          light: '#c9e6ff',
        },
        emerald: {
          humanitarian: '#10b981',
          dark: '#005539',
          light: '#6ffbbe',
        },
        gold: {
          recognition: '#f59e0b',
          light: '#fef3c7',
        },
        surface: {
          canvas: '#f8fafc',
          card: '#ffffff',
          dim: '#d2d9f4',
          container: '#eaedff',
        },
        subtle: '#e2e8f0',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      spacing: {
        'sidebar-full': '17.5rem',
        'sidebar-mini': '4.5rem',
        'header-h': '4.25rem',
      },
    },
  },
  plugins: [],
};
