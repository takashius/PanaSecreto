/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E1338',
          light: '#2D1D54',
          container: '#20153A',
        },
        secondary: {
          DEFAULT: '#F7A800',
          light: '#FFBF33',
          container: '#FEAE10',
        },
        accent: {
          DEFAULT: '#1D84B5',
          light: '#35A3D6',
        },
        tertiary: {
          DEFAULT: '#1D84B5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F1F3F5',
          container: '#F0ECF9',
        },
        background: '#F8F9FA',
        textDark: '#1C1B24',
        muted: '#6C757D',
        border: '#E2E8F0',
        danger: '#D62828',
        success: '#2A9D8F',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
