/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // Use the @tailwindcss/postcss plugin
    autoprefixer: {},
  },
};

export default config;