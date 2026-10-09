'use strict'

function forDefaultExportProperties(node, context, iterator) {
  if (node.declaration.type === 'Identifier') {
    const declaration = node.parent.body
      .filter(d => d.type === 'VariableDeclaration')
      .flatMap(d => d.declarations)
      .find(d => d.id.name === node.declaration.name)
    if (declaration && declaration.init && declaration.init.type === 'ObjectExpression') {
      const properties = declaration.init.properties
      for (let i = 0; i < properties.length; i++) {
        const curr = properties[i]
        const prev = i ? properties[i - 1] : null
        iterator(curr, prev, context)
      }
    }
  }
}

// bare package name of an import specifier (`pkg` or `@scope/pkg`), null for relative and builtin imports
function packageName(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.includes(':')) {
    return null
  }
  return specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/')
}

module.exports = {

  'prefer-package-directory-imports': {
    meta: {
      type: 'problem',
      fixable: 'code',
      schema: [{
        type: 'object',
        properties: {
          packages: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      }],
    },
    create(context) {
      const packages = new Set(context.options[0]?.packages ?? [])

      // packages without `exports` whose modules are directories with their own package.json, e.g. `primereact/inplace`;
      // the directories hold builds for several environments, and editors tend to import one of them by its file name
      const check = source => {
        if (source?.type !== 'Literal' || typeof source.value !== 'string') {
          return
        }
        const specifier = source.value
        const name = packageName(specifier)
        if (!name || !packages.has(name) || !/\.[cm]?js$/u.test(specifier)) {
          return
        }
        const directory = specifier.slice(0, specifier.lastIndexOf('/'))
        const quote = source.raw[0]

        if (directory === name) {
          // a file at the package root, such as a bundle of all modules, has no directory to import instead
          context.report({
            node: source,
            message: `Import a module directory of '${name}', not its file '${specifier}'.`,
          })
          return
        }
        context.report({
          node: source,
          message: `Import '${directory}' instead of its file '${specifier}'.`,
          fix: fixer => fixer.replaceText(source, `${quote}${directory}${quote}`),
        })
      }

      return {
        ImportDeclaration: node => check(node.source),
        ExportNamedDeclaration: node => check(node.source),
        ExportAllDeclaration: node => check(node.source),
        ImportExpression: node => check(node.source),
      }
    },
  },

  'no-default-export-object-shorthand': {
    meta: {
      type: 'suggestion',
      schema: [],
    },
    create(context) {
      return {
        ExportDefaultDeclaration(node) {
          forDefaultExportProperties(node, context, (curr, prev, ctx) => {
            if (!curr.shorthand) {
              return
            }

            ctx.report({
              node: curr,
              loc: curr.loc,
              message: 'Shorthand property syntax is not allowed in default export object. Define exported value directly within object.',
            })
          })
        },
      }
    },
  },

  'padding-line-between-default-export-object-properties': {
    meta: {
      type: 'layout',
      fixable: 'whitespace',
      schema: [{
        type: 'object',
        properties: {
          ignoreSingleLineProperties: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      }],
    },
    create(context) {
      const ignoreSingleLineProperties = context.options[0]?.ignoreSingleLineProperties

      return {
        ExportDefaultDeclaration(node) {
          forDefaultExportProperties(node, context, (curr, prev, ctx) => {
            const prevEnd = prev ? prev.loc.end : curr.parent.loc.start
            const currStart = curr.loc.start

            if (currStart.line - prevEnd.line >= 2) {
              return
            }

            if (ignoreSingleLineProperties && curr.loc.start.line === curr.loc.end.line) {
              return
            }

            ctx.report({
              node: curr,
              loc: {
                start: prevEnd,
                end: currStart,
              },
              message: 'Expected an empty line between default export object properties.',

              fix(fixer) {
                return fixer.insertTextBefore(curr, '\n')
              },
            })
          })
        },
      }
    },
  },
}
