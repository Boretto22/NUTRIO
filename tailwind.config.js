/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        grupo: {
          carbohidratos: '#E8A33D',
          proteicos1: '#F26D6D',
          proteicos2: '#C0392B',
          grasas: '#6B7280',
          verduras: '#27AE60',
          frutas: '#8E44AD',
        },
        /**
         * Escala derivada del verde muestreado del logo (`marca.500` es el píxel
         * exacto del trazo). Sobre blanco solo alcanza 3.99:1, así que los rellenos
         * sólidos con texto encima usan `600` (5.66:1) y el `500` queda para
         * identidad y superficies sin texto.
         */
        marca: {
          50: '#F2FAF8',
          100: '#E0F2EF',
          200: '#C2E5DE',
          300: '#96CFC3',
          400: '#62B9A6',
          500: '#408C7C',
          600: '#2F7264',
          700: '#235A4E',
          800: '#1B463D',
          900: '#163630',
        },
        /** Fondos de marca: el crema del logo y el verde legible sobre oscuro. */
        crema: '#F4F4F1',
        'marca-claro': '#4FB397',
      },
      boxShadow: {
        suave: '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px rgba(16, 24, 40, 0.06)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 180ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
