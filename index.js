const {default: BabelPluginSyntaxJsx} = require('@babel/plugin-syntax-jsx')

module.exports = api => {

  api.assertVersion(7)
  const t = api.types

  return {
    inherits: BabelPluginSyntaxJsx,
    visitor: {
      JSXElement(path) {
        path.replaceWith(transformElement(renderElement(path.node)))
      },
      JSXFragment(path) {
        path.replaceWith(transformElement(renderElement(path.node)))
      },
    },
  }

  /**
   * take array of quasis (strings) + expressions (AST nodes) and produce TemplateLiteral node
   * @param {Array<*>} parts
   * @return {object}
   **/
  function transformElement(parts) {

    // we have one mixed array and we need to split nodes by type
    const quasis = [], exprs = []

    let i = 0
    // do one iteration more to make sure we produce an empty string quasi at the end
    while (i < parts.length + 1) {

      let quasi = ''
      // join adjacent strings into one
      while (typeof parts[i] == 'string') {
        // we need to escape backticks and backslashes manually
        quasi += parts[i].replace(/[\\`]/g, s => `\\${s}`)
        i += 1
      }
      quasis.push(t.templateElement({raw: quasi}))

      // add a single expr node
      if (parts[i] != null) exprs.push(parts[i])

      i += 1 // repeat

    }

    return t.taggedTemplateExpression(
      t.identifier('html'),
      t.templateLiteral(quasis, exprs),
    )

  }

  /**
   * take JSXElement and return array of template strings and parts
   * @param {*} elem
   * @return {Array<*>}
   */
  function renderElement(elem) {
    if (elem.type == 'JSXFragment') {
      const children = elem.children.map(renderChild)
      return [...flatten(children)]
    }
    if (elem.type == 'JSXElement') {
      const {tag, isVoid} = renderTag(elem.openingElement.name)
      const attrs = elem.openingElement.attributes.map(renderProp)
      const children = elem.children.map(renderChild)
      return [
        '<', tag, ...flatten(attrs), '>',
        ...isVoid ? [] : flatten(children),
        ...isVoid ? [] : ['</', tag, '>'],
      ]
    }
    throw new Error(`Unknown element type: ${elem.type}`)
  }

  /**
   * Take JSXElement name (Identifier or MemberExpression) and return JS counterpart
   * @param {*} name
   * @param {boolean} root Whether it's the root of expression tree
   * @return {{tag: *, isVoid: boolean}}
   */
  function renderTag(name, root = true) {

    // name is an identifier
    if (name.type == 'JSXIdentifier') {

      const tag = name.name

      // it's a single lowercase identifier (e.g. `foo`)
      if (root && t.react.isCompatTag(tag)) {
        const isVoid = voidElements.includes(tag.toLowerCase())
        // return it as part of the template (`<foo>`)
        return {tag, isVoid}
      }

      // it's a single uppercase identifier (e.g. `Foo`)
      else if (root) {
        const object = t.identifier(tag)
        const property = t.identifier('is')
        // imitate React and try to use the class (`<${Foo.is}>`)
        return {tag: t.memberExpression(object, property)}
      }

      // it's not the only identifier, it's a part of a member expression
      // return it as identifier
      else return {tag: t.identifier(tag)}

    }

    // tag names can also be member expressions (`Foo.Bar`)
    if (name.type == 'JSXMemberExpression') {
      const expr = name // transform recursively
      const {tag: object} = renderTag(expr.object, false)
      const property = t.identifier(expr.property.name)
      const tag = root // stick `.is` to the root member expr
        ? t.memberExpression(t.memberExpression(object, property), t.identifier('is'))
        : t.memberExpression(object, property)
      return {tag} // return as member expr
    }

    throw new Error(`Unknown element tag type: ${name.type}`)

  }

  /**
   * Take JSXAttribute and return array of template strings and parts
   * @param {*} prop
   * @return {Array<*>}
   */
  function renderProp(prop) {

    const [jsxName, attributeName, eventName, propertyName]
      = prop.name.name.match(/^(?:(.*)\$|on-(.*)|(.*))$/)

    if (prop.value) { // prop has a value

      if (prop.value.type == 'StringLiteral') { // value is a string literal

        // we are setting an attribute, no lit-html involved, produce template strings
        if (attributeName) return [' ', `${attributeName}`, '=', prop.value.extra.raw]

        // setting property must involve lit-html, let's create a template expression here
        if (propertyName) return [' ', `.${propertyName}`, '=', t.stringLiteral(prop.value.extra.rawValue)]

        // setting event handler to a string doesn't make sense
        if (eventName) throw Error(`Event prop can't be a string literal`)

      }
      if (prop.value.type == 'JSXExpressionContainer') { // value is an expression

        // modify the name and produce a template expression in all cases
        if (attributeName) return [' ', `${attributeName}`, '=', prop.value.expression]
        if (propertyName) return [' ', `.${propertyName}`, '=', prop.value.expression]
        if (eventName) return [' ', `@${eventName}`, '=', prop.value.expression]

      }
    }
    else { // prop has no value

      // we are setting a boolean attribute, no lit-html involved, just remove the `$`
      if (attributeName) return [' ', `${attributeName}`]

      // valueless event handler doesn't make sense
      if (eventName) throw Error(`Event prop must have a value`)

      // Valueless property default to `true` (imitate React)
      if (propertyName) return [' ', `.${propertyName}`, '=', t.booleanLiteral(true)]

    }
    throw new Error(`Couldn't transform attribute ${JSON.stringify(jsxName)}`)

  }

  /**
   * Take JSX child node and return array of template strings and parts
   * @param {*} child
   * @return {Array<*>}
   */
  function renderChild(child) {

    if (child.type == 'JSXText') return [child.extra.raw] // text becomes part of template

    if (child.type == 'JSXExpressionContainer') {
      if (child.expression.type == 'JSXEmptyExpression') return []
      else return [child.expression] // expression renders as part
    }

    if (child.type == 'JSXElement' || child.type == 'JSXFragment')
      return renderElement(child) // recurse on element

    throw new Error(`Unknown child type: ${child.type}`)

  }

}

const flatten = arrs => arrs.reduce((xs, x) => [...xs, ...x], [])

const voidElements = [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command',
  'embed', 'frame', 'hr', 'image', 'img', 'input', 'isindex', 'keygen',
  'link', 'menuitem', 'meta', 'nextid', 'param', 'source', 'track', 'wbr',
]
