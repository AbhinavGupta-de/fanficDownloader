import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			fontFamily: {
				body: ['"Kelly Slab"', 'serif'],
				writing: ['"Playwrite FR Moderne"', 'cursive'],
			},
			colors: {
				primary: '#FF463F',
				background: '#20231F',
				secondary: '#FF8580',
				backgroundSecondary: '#85EE83',
			},
		},
	},
	plugins: [],
};

export default config;
