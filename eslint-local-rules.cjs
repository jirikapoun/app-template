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

module.exports = {

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
