import { globalIgnores } from '@eslint/config-helpers'
import mocha from '@strv/eslint-config-mocha'
import node from '@strv/eslint-config-node'
import nodeOptional from '@strv/eslint-config-node/optional'
import nodeStyle from '@strv/eslint-config-node/style'
import ts from '@strv/eslint-config-typescript'
import tsOptional from '@strv/eslint-config-typescript/optional'
import tsStyle from '@strv/eslint-config-typescript/style'
import consistentDefaultExportName from 'eslint-plugin-consistent-default-export-name'
import importX from 'eslint-plugin-import-x'
import localRules from 'eslint-plugin-local-rules'
import modulesNewline from 'eslint-plugin-modules-newline'
import globals from 'globals'


/** @typedef {import('eslint').Linter.FlatConfig} Config */

/** @type {Config} */
const allFiles = {
  files: ['**/{.*,*}.{js,cjs,mjs,ts,tsx}'],
}
/** @type {Config} */
const jsFiles = {
  files: ['**/{.*,*}.{js,cjs,mjs}'],
}
/** @type {Config} */
const tsFiles = {
  files: ['**/{.*,*}.{ts,tsx}'],
}
/** @type {Config} */
const tsxFiles = {
  files: ['**/{.*,*}.tsx'],
}
/** @type {Config} */
const testFiles = {
  files: ['test/**/*.ts'],
}

/** @type {Config[]} */
const eslintConfig = [
  // General
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
  ]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  // JavaScript
  { ...jsFiles, ...node },
  { ...jsFiles, ...nodeOptional },
  { ...jsFiles, ...nodeStyle },

  // TypeScript
  { ...tsFiles, ...node },
  { ...tsFiles, ...nodeOptional },
  { ...tsFiles, ...nodeStyle },
  { ...tsFiles, ...ts },
  { ...tsFiles, ...tsOptional },
  { ...tsFiles, ...tsStyle },
  {
    ...tsFiles,
    settings: {
      'import-x/resolver': {
        typescript: {},
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-exports': ['warn', {}],
      '@typescript-eslint/no-floating-promises': ['error', { checkThenables: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/only-throw-error': ['error', {
        allowThrowingAny: true,
        allowThrowingUnknown: true,
      }],
      '@typescript-eslint/prefer-nullish-coalescing': ['warn', {
        ignoreConditionalTests: true,
        ignorePrimitives: {
          boolean: true,
          string: true,
        },
      }],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/return-await': ['error', 'error-handling-correctness-only'],
      '@typescript-eslint/switch-exhaustiveness-check': ['error', {
        considerDefaultExhaustiveForUnions: true,
        requireDefaultForNonUnion: true,
      }],
    },
  },

  // Global overrides
  {
    ...allFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      'consistent-default-export-name': consistentDefaultExportName,
      'import-x': importX,
      'modules-newline': modulesNewline,
      'local-rules': localRules,
    },
    settings: {
      'import/internal-regex': '^@app/',
      'import/resolver': {
        node: { extensions: ['.js', '.cjs', '.mjs', '.ts', '.tsx'] },
      },
      'import-x/internal-regex': '^@app/',
      'import-x/resolver': {
        node: { extensions: ['.js', '.cjs', '.mjs', '.ts', '.tsx'] },
      },
    },
    rules: {
      '@stylistic/brace-style': ['warn', '1tbs'],
      '@stylistic/indent': ['warn', 2, {
        SwitchCase: 1,
        ignoredNodes: [
          'TSUnionType',
          'FunctionExpression[params]:has(Identifier[decorators])',
        ],
      }],
      '@stylistic/max-len': ['warn', {
        code: 180,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      }],
      '@stylistic/newline-per-chained-call': 'off',
      '@stylistic/object-curly-newline': ['warn', { multiline: true, consistent: true }],
      '@stylistic/object-property-newline': ['warn', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/padded-blocks': 'off',
      '@stylistic/padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: ['cjs-import', 'directive'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['cjs-export', 'class', 'export', 'function'] },
        { blankLine: 'never', prev: 'directive', next: 'directive' },
        { blankLine: 'never', prev: 'cjs-import', next: 'cjs-import' },
      ],
      '@stylistic/quote-props': ['warn', 'consistent-as-needed'],
      'consistent-default-export-name/default-export-match-filename': ['warn', ['kebab'], ['\\.', '-'], true],
      'eqeqeq': ['error', 'smart'],
      'func-names': ['warn', 'as-needed'],
      'import/consistent-type-specifier-style': ['warn', 'prefer-top-level'],
      'import/enforce-node-protocol-usage': ['warn', 'always'],
      'import/group-exports': 'warn',
      'import/newline-after-import': ['warn', { count: 2, considerComments: true }],
      'import/no-anonymous-default-export': ['warn', { allowCallExpression: false }],
      'import/no-duplicates': ['warn', { 'prefer-inline': false }],
      'import/no-named-as-default': 'off',
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        sortTypesGroup: true,
        alphabetize: { order: 'asc', caseInsensitive: true },
        named: { enabled: true, export: false, cjsExports: false },
      }],
      'import/prefer-default-export': ['warn', { target: 'any' }],
      'import-x/order': ['warn', {
        'groups': [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'type'],
        'newlines-between': 'always',
      }],
      'indent': 'off',
      'local-rules/no-default-export-object-shorthand': 'warn',
      'local-rules/padding-line-between-default-export-object-properties': ['warn', { ignoreSingleLineProperties: true }],
      'max-params': ['warn', 5],
      'modules-newline/export-declaration-newline': 'warn',
      'no-empty-function': ['warn', { allow: ['methods'] }],
      'prefer-object-spread': 'warn',
    },
  },

  // TSX files
  {
    ...tsxFiles,
    rules: {
      'consistent-default-export-name/default-export-match-filename': ['warn', null, ['\\.', '-'], true],
    },
  },

  // Tests
  { ...testFiles, ...mocha },
  {
    ...testFiles,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },

  // Other
  {
    files: ['libs/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      'consistent-default-export-name/default-export-match-filename': 'off',
      'import/prefer-default-export': 'off',
    },
  },
]

export default eslintConfig
