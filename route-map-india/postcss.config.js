// PostCSS configuration for Tailwind CSS v4
// Uses the new @tailwindcss/postcss plugin.
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwind(),
    autoprefixer(),
  ],
};


