/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: {
                    bg: {
                        dark: "rgba(30, 30, 47, 0.85)",
                        medium: "rgba(45, 45, 75, 0.75)",
                        light: "rgba(60, 60, 95, 0.65)",
                        card: "rgba(40, 40, 70, 0.8)",
                    },
                    border: {
                        light: "rgba(255, 255, 255, 0.15)",
                        medium: "rgba(255, 255, 255, 0.1)",
                    },
                    text: {
                        primary: "#ffffff",
                        secondary: "rgba(255, 255, 255, 0.7)",
                        muted: "rgba(255, 255, 255, 0.5)",
                    },
                    accent: {
                        primary: "#6366f1", // Indigo
                        secondary: "#8b5cf6", // Violet
                        success: "#22c55e", // Green
                        warning: "#f59e0b", // Amber
                        danger: "#ef4444", // Red
                        info: "#06b6d4", // Cyan
                    }
                }
            },
            backgroundImage: {
                'gradient-mesh': "radial-gradient(at 40% 20%, hsla(240, 70%, 50%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(280, 70%, 50%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(200, 70%, 50%, 0.2) 0px, transparent 50%)",
                'gradient-dark': "linear-gradient(to bottom right, #1e1e2f, #2d2d4b)",
            },
            backdropBlur: {
                xs: '2px',
                glass: '20px',
                heavy: '40px',
            }
        },
    },
    plugins: [],
}
