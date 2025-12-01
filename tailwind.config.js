/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e', // standard green-500, adjust as needed
          600: '#16a34a',
        },
        warn: {
          500: '#f59e0b', // amber-500
        },
        danger: {
          500: '#ef4444', // red-500
        }
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite', // 8秒转一圈，很慢很优雅
      }
    },
  },
  plugins: [],
}
