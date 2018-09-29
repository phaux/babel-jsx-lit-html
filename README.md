# babel-plugin-transform-jsx-lit-html

[![npm](https://img.shields.io/npm/v/babel-plugin-transform-jsx-lit-html.svg)](https://www.npmjs.com/package/babel-plugin-transform-jsx-lit-html)
[![travis](https://travis-ci.org/phaux/babel-jsx-lit-html.svg?branch=master)](https://travis-ci.org/phaux/babel-jsx-lit-html)

## Example

**In**

```js
const renderProfile = user => <>
  <img class$="profile" src={user.avatarUrl} />
  <h3>{user.firstName} {user.lastName}</h3>
  <button on-click={() => user.addFriend()}>Add friend</button>
</>;
```

**Out**

```js
const renderProfile = user => html`
  <img class="profile" .src=${user.avatarUrl}>
  <h3>${user.firstName} ${user.lastName}</h3>
  <button @click=${() => user.addFriend()}>Add friend</button>
`;
```

## Props syntax

Regular JSX props map to lit-html property setters.
To set an attribute use `attr$` syntax.
To set an event handler use `on-event` syntax.

```js
// In
const input = <input type$="text" value={val} on-change={handleChange}/>;
// Out
const input = html`<input type="text" .value=${val} @change=${handleChange}>`;
```

## Installation

```sh
npm install --save-dev babel-plugin-transform-jsx-lit-html
```

## Usage

### Via `.babelrc`

```json
{
  "plugins": ["transform-jsx-lit-html"]
}
```

### Via CLI

```sh
babel --plugins transform-jsx-lit-html script.js
```
