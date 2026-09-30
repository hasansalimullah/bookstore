import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { fontFamily: { sans: ["Tahoma", "Segoe UI", "system-ui", "sans-serif"] } } },
  plugins: [],
} satisfies Config;
