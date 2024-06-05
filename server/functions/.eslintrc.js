module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
	},
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	rules: {
		// Customize your rules
	},
	ignorePatterns: [
		// Add patterns to ignore, if necessary
		'lib/*',
	],
};
