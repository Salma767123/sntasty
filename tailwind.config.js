/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3d7935", // Green from palette
          light: "#3d7935", // Same green for hovers
          dark: "#234d1b", // Dark green for text
        },
        secondary: {
          DEFAULT: "#ece0cc", // Cream Background
          dark: "#ffd788", // Light gold
        },
        brown: {
          DEFAULT: "#8B5E3C", // Soft Brown Accent
          light: "#A07050",
        },
        accent: {
          DEFAULT: "#f8bf51", // Golden CTA Buttons
          hover: "#ffd788",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        serif: ["var(--font-baloo)", "cursive"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
