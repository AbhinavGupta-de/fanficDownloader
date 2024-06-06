module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
		tsconfigRootDir: __dirname,
		sourceType: 'module',
	},
	extends: [
		'plugin:@typescript-eslint/recommended',
		'prettier', // Ensure prettier config is applied
		'plugin:prettier/recommended',
	],
	rules: {
		// Define custom rules if needed
	},
	ignorePatterns: ['lib/**', 'node_modules/**', '.eslintrc.js'], // Ignore built files and node_modules
};
