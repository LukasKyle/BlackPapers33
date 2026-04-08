/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './types.ts'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00ff9d',
        'primary-dark': '#00cc7d',
        secondary: '#1a1a1a',
        surface: '#2d2d2d',
        accent: '#ff3b30'
      },
      fontFamily: {
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace'
        ]
      }
    }
  },
  plugins: []
};
