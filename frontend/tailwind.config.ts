import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MONOCHROME BASE (Black, Gray, Silver, White)
        "background": "#000000",
        "surface": "#0a0a0a",
        "surface-container": "#111111",
        "surface-container-high": "#1a1a1a",
        "surface-container-highest": "#222222",
        "outline-variant": "#333333",
        "outline": "#666666",
        "surface-variant": "#888888",
        
        "on-background": "#ffffff",
        "on-surface": "#e0e0e0",
        "on-surface-variant": "#a0a0a0",
        
        // HIGHLIGHTS / ALERTS 
        "primary": "#cccccc", // Defaults strictly monochrome 
        "secondary": "#a0a0a0", 
        "tertiary": "#ffffff", 

        "error": "#ff3333", // Critical red
        "success": "#33ff33", // Good logs green
        "warning": "#ffff33", // Warnings yellow
        
        anomaly: {
          critical: '#ff3333',
          high:     '#ff6600',
          medium:   '#ffff33',
          low:      '#33ff33',
        }
      },
      fontFamily: {
        // Using Manrope for all standard text 
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
        
        // Iosevka Charon for data grids, numbers, codes
        mono: ['"Iosevka Charon"', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in':   'slideIn 0.2s ease-out',
        'fade-in':    'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
} satisfies Config
