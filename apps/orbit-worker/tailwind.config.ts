import { colors, radius } from '@40labs/design-tokens';

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

const tailwindColors: Record<string, string> = {};
for (const [key, value] of Object.entries(colors)) {
  tailwindColors[camelToKebab(key)] = value as string;
}

const tailwindRadius: Record<string, string> = {};
for (const [key, value] of Object.entries(radius)) {
  tailwindRadius[camelToKebab(key)] = value as string;
}

export default {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tailwindColors,
      borderRadius: tailwindRadius,
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        ui: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
