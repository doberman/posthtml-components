# Components Plugin <img align="right" width="220" height="200" title="PostHTML logo" src="https://posthtml.github.io/posthtml/logo.svg">

Opinionated components plugin. Replaces custom HTML elements with content from template files with the same name as the element. Based on [posthtml-modules](https://github.com/posthtml/posthtml-modules).

Before:
```html
<!-- index.html -->
<div>
    <my-component locals='{"title":"Wow"}'>
        <p>Some content</p>
    </my-component>
</div>
```

```html
<!-- my-component.html -->
<div class="my-component">
    <h1 class="my-component__title">{{ title }}</h1>
    <div class="my-component__content"><content></content></div>
</div>
```

After:
```html
<div>
    <div class="my-component">
        <h1 class="my-component__title">Wow</h1>
        <div class="my-component__content">
            <p>Some content</p>
        </div>
    </div>
</div>
```

## Install

```sh
npm install posthml-components
```

## Usage

```js
const { readFileSync, writeFileSync } = require('fs')
const posthtml = require('posthtml');
const posthtmlComponents = require('posthtml-components');

posthtml()
    .use(posthtmlComponents({ /* options */ }))
    .process(readFileSync('index.html' /*, options */)
    .then(result => writeFileSync('./after.html', result.html));
```

## Options

### `root`

Type: `string`
Default: `./`

Path for components lookup.