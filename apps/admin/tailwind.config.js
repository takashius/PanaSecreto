/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B2D5B', // Azul Marino
          light: '#1A4580',
          dark: '#071E3D',
        },
        secondary: {
          DEFAULT: '#FFC107', // Amarillo Pana
          light: '#FFD54F',
          dark: '#C79100',
        },
        accent: {
          DEFAULT: '#00B4D8', // Celeste Caribe
          light: '#48CAE4',
          dark: '#0090AD',
        },
        coral: {
          DEFAULT: '#FF5A3D', // Coral Guacamaya
          light: '#FF8A73',
          dark: '#E0442A',
        },
        danger: {
          DEFAULT: '#D62828', // Rojo Guacamaya
          light: '#E64C4C',
          dark: '#B01E1E',
        },
        background: '#F8F7F2', // Crema (token background)
        textDark: '#13213A',   // Tinta Marina
        surface: '#FFFFFF',    // Blanco Puro
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        heading: ['Fredoka', 'Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
