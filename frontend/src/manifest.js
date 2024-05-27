import { defineManifest } from '@crxjs/vite-plugin';
import packageData from '../package.json';

export default defineManifest({
	name: 'Fanfic Downloader Extension',
	description: 'Download fanfics from various websites.',
	version: packageData.version,
	manifest_version: 3,
	icons: {
		128: 'img/logo.jpg',
	},
	action: {
		default_popup: 'popup.html',
		default_icon: 'img/logo.jpg',
	},

	background: {
		service_worker: 'src/background/index.js',
		type: 'module',
	},
	content_scripts: [
		{
			matches: ['http://*/*', 'https://*/*'],
			js: ['src/contentScript/index.js'],
		},
	],
	permissions: ['storage', 'downloads', 'activeTab', 'scripting', 'tabs'],
});
