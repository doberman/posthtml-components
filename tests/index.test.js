const plugin = require("..");
const posthtml = require("posthtml");

const clean = (html) => html.replace(/(\n|\t)/g, "").trim();
const options = { root: "./tests" };

it("should include html", async () => {
  const actual = `<div><my-element></my-element></div>`;
  const expected = `<div><div class="test">Test</div></div>`;
  const html = await posthtml()
    .use(plugin(options))
    .process(actual)
    .then((result) => clean(result.html));
  expect(html).toEqual(expected);
});
