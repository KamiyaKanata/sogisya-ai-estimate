import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2B3A4E',
          light: '#3D4F65',
          dark: '#1E2A3A',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#D4A017',
          dark: '#8B6508',
        },
      },
    },
  },
  plugins: [],
}
export default config
