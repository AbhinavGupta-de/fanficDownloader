import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			input: {
				main: 'index.html',
				content: 'src/content.ts',
				background: 'src/background.ts',
			},
			output: {
				entryFileNames: '[name].js',
			},
		},
	},
});
