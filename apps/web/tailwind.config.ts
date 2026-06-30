import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F5F5",
        ink: "#000000",
        plum: "#2B2644",
      },
      maxWidth: {
        app: "88rem",
      },
    },
  },
  plugins: [],
};

export default config;
