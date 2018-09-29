/* eslint no-console: off */

const babel = require('@babel/core')
const assert = require('assert')

const options = {plugins: ['module:./index.js']}

const test = (desc, input, output) => {
  console.log(`${desc}...`)
  const {code} = babel.transformSync(input, options)
  assert.equal(code, output)
}

console.log('### Elements')

test(
  "Transforms element",
  '<div/>;',
  'html`<div></div>`;'
)

test(
  "Transforms void element",
  '<br/>;',
  'html`<br>`;'
)

test(
  "Discards content of void element",
  '<br>test</br>;',
  'html`<br>`;'
)

test(
  "Transforms fragment",
  '<>foo</>;',
  'html`foo`;'
)

console.log('### Tag names')

test(
  "Transforms custom element tag name",
  '<my-element/>;',
  'html`<my-element></my-element>`;'
)

test(
  "Transforms component class",
  '<Component/>;',
  'html`<${Component.is}></${Component.is}>`;'
)


test(
  "Transforms member expression",
  '<foo.bar/>;',
  'html`<${foo.bar.is}></${foo.bar.is}>`;'
)

console.log('### Attributes')

test(
  "Transforms string attributes",
  `<input type$="text" value$='foo'/>;`,
  'html`<input type="text" value=\'foo\'>`;'
)

test(
  "Transforms expression attributes",
  `<input value$={val}/>;`,
  'html`<input value=${val}>`;'
)

test(
  "Doesn't transform entities in string attributes",
  `<input value$="&quot;"/>;`,
  'html`<input value="&quot;">`;'
)

test(
  "Escapes string attributes",
  `<input value$='\\\\' placeholder$="\`"/>;`,
  `html\`<input value='\\\\\\\\' placeholder="\\\`">\`;`
)

test(
  "Transforms boolean attributes",
  `<input disabled$/>;`,
  'html`<input disabled>`;'
)

test(
  "Transforms string props",
  `<input type="text" value='foo'/>;`,
  'html`<input .type=${"text"} .value=${"foo"}>`;'
)

test(
  "Transform entities in string props",
  `<input value="&quot;"/>;`,
  'html`<input .value=${"\\""}>`;'
)

test(
  "Transforms expression props",
  `<input value={val}/>;`,
  'html`<input .value=${val}>`;'
)

test(
  "Transforms boolean props",
  `<input disabled/>;`,
  'html`<input .disabled=${true}>`;'
)

test(
  "Transforms event handlers",
  `<input on-input={console.log}/>;`,
  'html`<input @input=${console.log}>`;'
)

console.log('### Children')

test(
  "Transforms text children",
  `<p> foo bar </p>;`,
  'html`<p> foo bar </p>`;'
)

test(
  "Escapes text children",
  '<p> `\\` </p>;',
  'html`<p> \\`\\\\\\` </p>`;'
)

test(
  "Doesn't transform entities in text children",
  '<p> &quot; </p>;',
  'html`<p> &quot; </p>`;'
)

test(
  "Transforms expression children",
  `<p> foo: {val} </p>;`,
  'html`<p> foo: ${val} </p>`;'
)

test(
  "Skips empty expression children",
  `<p>{ } { /* comment */ }</p>;`,
  'html`<p> </p>`;'
)

test(
  "Transforms element children",
  `<p> foo: <b> {val} </b> </p>;`,
  'html`<p> foo: <b> ${val} </b> </p>`;'
)

test(
  "Transforms fragment children",
  `<p> foo: <>{val}</> </p>;`,
  'html`<p> foo: ${val} </p>`;'
)

console.log("All tests passed successfully! 🎉")
