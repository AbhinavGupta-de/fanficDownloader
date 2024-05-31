/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		colors: {
			primary: '#FF463F',
			background: '#20231F',
			white: '#FFFFFF',
		},
		extend: {
			fontFamily: {
				body: '"Kelly Slab"',
			},
		},
	},
	plugins: [],
};
