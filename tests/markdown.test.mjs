import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/lib/markdown.ts";

test("raw scripts and arbitrary iframe sources are removed", async () => {
  const { html } = await renderMarkdown('<script>alert(1)</script><iframe src="https://evil.example"></iframe><img src="x" onerror="alert(1)">');
  assert.doesNotMatch(html, /<script|<iframe|onerror|alert\(1\)/);
});
test("only a standalone official Bilibili link gets a click-to-load video", async () => {
  const { html } = await renderMarkdown("[视频](https://www.bilibili.com/video/BV1httT6LEfy/)");
  assert.match(html, /data-bilibili="BV1httT6LEfy"/);
  assert.doesNotMatch(html, /<iframe/);
  const bad = await renderMarkdown("[视频](https://www.bilibili.com.evil.example/video/BV1httT6LEfy/)");
  assert.doesNotMatch(bad.html, /data-bilibili/);
});
test("Chinese headings have unique safe IDs matching the table of contents", async () => {
  const { html, toc } = await renderMarkdown("## 如何选重量\n\n## 如何选重量");
  assert.equal(toc.length, 2);
  assert.notEqual(toc[0].id, toc[1].id);
  for (const item of toc) assert.ok(html.includes('id="' + item.id + '"'));
});
