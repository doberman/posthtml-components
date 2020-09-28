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

it("should include content", async () => {
  const actual = `<div><my-wrap>Test content</my-wrap></div>`;
  const expected = `<div><div class="wrap">Test content</div></div>`;
  const html = await posthtml()
    .use(plugin(options))
    .process(actual)
    .then((result) => clean(result.html));
  expect(html).toEqual(expected);
});

it("should use locals", async () => {
  const actual = `<div><with-locals locals={"type":"submit"}>A button</with-locals></div>`;
  const expected = `<div><button type="submit">A button</button></div>`;
  const html = await posthtml()
    .use(plugin(options))
    .process(actual)
    .then((result) => clean(result.html));
  expect(html).toEqual(expected);
});

it("should parse wrapped component", async () => {
  const actual = `<div><my-wrap><my-wrap>Test</my-wrap></my-wrap></div>`;
  const expected = `<div><div class="wrap"><div class="wrap">Test</div></div></div>`;
  const html = await posthtml()
    .use(plugin(options))
    .process(actual)
    .then((result) => clean(result.html));
  expect(html).toEqual(expected);
});
