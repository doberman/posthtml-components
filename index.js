"use strict";

const { readFileSync } = require("fs");
const path = require("path");
const posthtml = require("posthtml");
const parser = require("posthtml-parser");
const { match } = require("posthtml/lib/api");
const expressions = require("posthtml-expressions");
const isJSON = require("is-json");

/**
 * @param {Object} options Passed when configuring plugin (through API or config file)
 * @returns {Function} Main parsing function
 */
function main(options = {}) {
  options.root = options.root || "./";
  options.encoding = options.encoding || "utf-8";

  /**
   * @param {Object} options
   * @param {Object} tree
   * @returns {Object}
   */
  return function parseTree(tree) {
    tree.parser = tree.parser || parser;
    tree.match = tree.match || match;

    tree.match({ tag: /.+-.+/ }, (node) => {
      const filePath = path.resolve(options.root, `${node.tag}.html`);
      let html = readFileSync(filePath, options.encoding);

      if (node.attrs && node.attrs.locals && isJSON(node.attrs.locals)) {
        const result = posthtml()
          .use(expressions({ locals: JSON.parse(node.attrs.locals) }))
          .process(html, { sync: true });
        html = result.html;
      }

      const subtree = tree.parser(html);
      subtree.match = tree.match;
      subtree.parser = tree.parser;

      const content = subtree.match({ tag: "content" }, () => {
        if (node.content && node.attrs && isJSON(node.attrs.locals)) {
          return expressions({ locals: JSON.parse(node.attrs.locals) })(
            node.content
          );
        }

        return node.content || "";
      });

      if (tree.messages) {
        tree.messages.push({
          type: "dependency",
          file: filePath,
        });
      }

      return {
        tag: false,
        content,
      };
    });

    return tree;
  };
}

module.exports = main;
