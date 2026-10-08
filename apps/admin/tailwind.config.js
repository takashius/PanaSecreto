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
          DEFAULT: '#1E1338', // Morado Noche
          light: '#2D1D54',
          dark: '#140C26',
        },
        secondary: {
          DEFAULT: '#F7A800', // Amarillo Araguaney
          light: '#FFBF33',
          dark: '#CC8A00',
        },
        accent: {
          DEFAULT: '#1D84B5', // Azul Caribe
          light: '#35A3D6',
          dark: '#146083',
        },
        danger: {
          DEFAULT: '#D62828', // Rojo Guacamaya
          light: '#E64C4C',
          dark: '#B01E1E',
        },
        background: '#F5F5F5', // Fondo Claro Estilo UniSan
        textDark: '#1C1B24',   // Carbón Lente
        surface: '#FFFFFF',    // Blanco Puro
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
