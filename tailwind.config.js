/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)'],
                body: ['var(--font-body)'],
                mono: ['var(--font-mono)'],
                display: ['var(--font-display)'],
                heading: ['var(--font-heading)'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    light: 'hsl(var(--primary-light))'
                },
                'primary-light': 'hsl(var(--primary-light))',
                'background-elevated': 'hsl(var(--background-elevated))',
                neon: 'hsl(var(--neon))',
                magenta: 'hsl(var(--magenta))',
                success: 'hsl(var(--success))',
                warning: 'hsl(var(--warning))',
                danger: 'hsl(var(--danger))',
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                }
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
                    '100%': { transform: 'translateX(300%) skewX(-15deg)' }
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 4px currentColor' },
                    '50%': { boxShadow: '0 0 12px currentColor, 0 0 4px currentColor' }
                },
                /* ── NEW: Premium page transition ── */
                'fade-in-up': {
                    '0%': { 
                        opacity: '0', 
                        transform: 'translateY(5px) scale(0.998)',
                        filter: 'blur(1px)'
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'translateY(0) scale(1)',
                        filter: 'blur(0px)'
                    }
                },
                /* ── NEW: Ambient orb float ── */
                'float': {
                    '0%, 100%': { transform: 'translateY(0) scale(1)' },
                    '50%': { transform: 'translateY(-20px) scale(1.05)' }
                },
                /* ── NEW: Subtle border glow pulse ── */
                'border-pulse': {
                    '0%, 100%': { borderColor: 'rgba(214,40,40,0.08)' },
                    '50%': { borderColor: 'rgba(214,40,40,0.18)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'shimmer': 'shimmer 1.8s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                /* ── NEW ── */
                'fade-in-up': 'fade-in-up 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                'float': 'float 8s ease-in-out infinite',
                'border-pulse': 'border-pulse 4s ease-in-out infinite',
            },
            /* ── NEW: Background image utilities ── */
            backgroundImage: {
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}