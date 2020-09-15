"use strict";

const fs = require("fs");
const path = require("path");
const isJSON = require("is-json");
const posthtml = require("posthtml");
const render = require("posthtml-render");
const expressions = require("posthtml-expressions");

/**
 * Process every node content with posthtml
 * @param  {Object} node [posthtml element object]
 * @param  {Object} options
 * @return {Function}
 */
function processNodeContentWithPosthtml(node, options) {
  return function (content) {
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
 * @param  {Object} options  [plugin options object]
 * @param  {String} href     [node's href attribute value]
 * @return {Promise<String>} [Promise with file content's]
 */
function readFile(options, href) {
  const filePath = path.join(options.root, href);

  return new Promise((resolve, reject) => {
    return fs.readFile(filePath, "utf8", (error, response) =>
      error ? reject(error) : resolve(response)
    );
  });
}

/**
 * @param  {Object} options   [plugin options]
 * @return {Promise | Object} [posthtml tree or promise]
 */
function parse(options) {
  return function (tree) {
    const promises = [];

    tree.match({ tag: /^.+-.+/ }, (node) => {
      promises.push(
        readFile(options, `${node.tag}.html`)
          .then(processNodeContentWithPosthtml(node, options))
          .then((tree) => {
            // Recursively call parse with node's content tree
            return parse(
              Object.assign({}, options, {
                root: path.join(options.root, node.tag),
              })
            )(tree);
          })
          .then((tree) => {
            // Remove <content> tags and replace them with node's content
            const content = tree.match({ tag: "content" }, () => {
              if (node.content && node.attrs && isJSON(node.attrs.locals)) {
                return parseLocals(node.attrs.locals)(node.content);
              }

              return node.content || "";
            });
            // Remove <module> tag and set inner content
            node.tag = false;
            node.content = content;
          })
      );

      return node;
    });

    return promises.length > 0 ? Promise.all(promises).then(() => tree) : tree;
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
