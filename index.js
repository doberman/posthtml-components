"use strict";

const fs = require("fs");
const path = require("path");
const isJSON = require("is-json");
const posthtml = require("posthtml");
const render = require("posthtml-render");
const expressions = require("posthtml-expressions");

/**
 * Plugin options
 * @typedef Options
 * @type {object}
 * @property {string} Options.root [path for component files]
 */

/**
 * Process every node content with posthtml
 * @param  {Object} node [posthtml element object]
 * @param  {Options} options [plugin options]
 * @return {Function}
 */
function processNodeContentWithPosthtml(node, options) {
  // console.log("processNodeContentWithPosthtml called", node.tag);
  return function (content) {
    // console.log("inner processNodeContentWithPosthtml", node.tag, content);
    return processWithPostHtml(
      options.plugins,
      path.join(options.root, node.tag),
      content,
      [parseLocals(node.attrs && node.attrs.locals)]
    );
  };
}

/**
 *
 * @param   {String}    locals  [string to parse as locals object]
 * @return  {Function}          [Function containing evaluated locals, or empty object]
 */
function parseLocals(locals) {
  try {
    return expressions({ locals: JSON.parse(locals) });
  } catch {
    return () => {};
  }
}

/**
 * readFile
 * @param  {Options} options  [plugin options object]
 * @param  {String} tag     [node's tag name]
 * @return {Promise<String>} [Promise with file content's]
 */
function readFile(options, tag) {
  const filePath = path.join(options.root, `${tag}.html`);
  return fs.readFileSync(filePath, "utf8");
}

/**
 * @param  {Options} options   [plugin options]
 * @return {() => Promise | Object} [posthtml tree or promise]
 */
function parse(options) {
  return async function (tree) {
    const nodes = [];

    // find all nodes and store in reverse order
    tree.match({ tag: /.+-.+/ }, (node) => {
      nodes.unshift(node);
      return node;
    });

    // loop through all nodes and parse them
    for (const node of nodes) {
      const fileContents = readFile(options, node.tag);
      let tree = await processNodeContentWithPosthtml(
        node,
        options
      )(fileContents);
      tree = await parse(options)(tree);
      const content = tree.match({ tag: "content" }, () => {
        if (node.content && node.attrs && isJSON(node.attrs.locals)) {
          const parsedLocals = parseLocals(node.attrs.locals)(node.content);
          return parsedLocals;
        }

        return node.content || "";
      });
      node.tag = false;
      node.content = content;
    }

    return tree;
  };
}

/**
 * @param  {Array | Function} plugins [array of plugins to apply or function, which will be called with from option]
 * @param  {String}           from    [path to the processing file]
 * @param  {Object} 					 content [posthtml tree to process]
 * @param  {Array}            prepend [array of plugins to process before plugins param]
 * @return {Object}                   [processed poshtml tree]
 */
function processWithPostHtml(plugins, from, content, prepend) {
  return posthtml(
    (prepend || []).concat(
      typeof plugins === "function" ? plugins(from) : plugins
    )
  )
    .process(render(content))
    .then((result) => result.tree);
}

module.exports = (options = {}) => {
  options.plugins = options.plugins || [];
  options.initial = options.initial || false;
  options.root = path.resolve(options.root || "./");

  return function (tree) {
    if (options.initial) {
      const parsed = parse(options)(tree);

      if (parsed instanceof Promise) {
        return parsed.then((content) =>
          processWithPostHtml(options.plugins, options.root, content)
        );
      }

      return processWithPostHtml(options.plugins, options.root, parsed);
    }

    return parse(options)(tree);
  };
};
