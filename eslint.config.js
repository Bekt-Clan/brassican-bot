import tseslint from 'typescript-eslint';
import vitestlint from 'eslint-plugin-vitest';

export default tseslint.config(
    ...tseslint.configs.recommended,
    vitestlint.configs['recommended'],
    {
        ignores: ['build/**', 'node_modules/**'],
    },
    {
        files: ['**/*.ts'],
        rules: {
            strict: 'off',
            camelcase: 0,
            eqeqeq: 'error',
            indent: 'off',
            'import/prefer-default-export': 0,
            'no-restricted-syntax': 0,
            'func-names': 'warn',
            'max-len': 0,
            'no-console': 0,
            'no-continue': 0,
            'no-await-in-loop': 0,
            'import/extensions': 0,
            'comma-dangle': 'off',
            'no-param-reassign': [
                'error',
                {
                    props: false,
                },
            ],
            'no-unused-vars': 'off',
            'require-jsdoc': 'off',
            'new-cap': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/no-shadow': ['error'],
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'vitest/expect-expect': 'off',
            'vitest/require-top-level-describe': 'error',
            'vitest/consistent-test-it': ['error', { fn: 'test' }],
            'vitest/valid-title': [
                'warn',
                {
                    mustNotMatch: [
                        '\\.$',
                        'Titles should not end with a full-stop',
                    ],
                    mustMatch: {
                        test: [
                            new RegExp(`^When.*?then.*?$`, 'u').source,
                            "A test name must conform to the standard pattern of 'When {scenario}, then {expectation}",
                        ],
                        it: [
                            new RegExp(`^When.*?then.*?$`, 'u').source,
                            "A test name must conform to the standard pattern of 'When {scenario}, then {expectation}",
                        ],
                    },
                },
            ],
        },
    }
);
