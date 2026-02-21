
/**
 * tailwind.config.js - Tailwind CSS Configuration
 * =================================================
 * Configures Tailwind CSS for the project with:
 * - Custom colors matching the brand
 * - Extended animations
 * - Content paths for purging
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Files to scan for class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  // Safelist dynamic classes that are constructed at runtime
  safelist: [
    { pattern: /(bg|text|border)-(red|green|yellow|orange|purple)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],
  
  theme: {
    extend: {
      // Custom colors
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      
      // Custom animations
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
      },
      
      // Keyframes
      keyframes: {
        slideIn: {
          'from': { 
            transform: 'translateX(100%)', 
            opacity: '0' 
          },
          'to': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseRing: {
          '0%': { 
            transform: 'scale(0.8)', 
            opacity: '1' 
          },
          '100%': { 
            transform: 'scale(1.3)', 
            opacity: '0' 
          },
        },
      },
      
      // Custom fonts
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      
      // Box shadows
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-lg': '0 0 40px rgba(124, 58, 237, 0.4)',
      },
      
      // Border radius
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  
  // Plugins
  plugins: [],
};