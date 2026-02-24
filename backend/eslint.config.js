import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules', 'certs']
    },
    js.configs.recommended,
    {
        files: ['**/*.js', '**/*.cjs'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.node,
                ...globals.commonjs,
                process: 'readonly',
                Buffer: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            'no-unused-vars': ['warn', {
                varsIgnorePattern: '^[A-Z_]',
                argsIgnorePattern: '^_'
            }],
            'no-undef': 'warn',
        },
    },
];
