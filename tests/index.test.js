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

it('should include content', async () => {

  const actual = `<div><my-wrap>Test content</my-wrap></div>`;
  const expected = `<div><div class="wrap">Test content</div></div>`;
  const html = await posthtml()
    .use(plugin(options))
    .process(actual)
    .then((result) => clean(result.html));
  expect(html).toEqual(expected);
})