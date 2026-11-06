import type { Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

export interface Heading { id: string; text: string; level: number }
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "details", "summary"],
  attributes: { ...defaultSchema.attributes, details: ["open"] },
  strip: ["script", "style", "iframe", "object", "form", "template"],
};

export async function renderMarkdown(markdown: string): Promise<{ html: string; toc: Heading[] }> {
  const toc: Heading[] = [];
  const used = new Map<string, number>();
  const html = String(await unified()
    .use(remarkParse).use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw).use(rehypeSanitize, schema)
    .use(() => (tree: Root) => {
      visit(tree, "element", (node) => {
        if (/^h[2-6]$/.test(node.tagName)) {
          const text = toString(node);
          const base = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
          const count = used.get(base) ?? 0;
          used.set(base, count + 1);
          const id = "section-" + base + (count ? "-" + count : "");
          node.properties.id = id;
          toc.push({ id, text, level: Number(node.tagName[1]) });
        }
        if (node.tagName === "img") {
          node.properties.loading = "lazy";
          node.properties.decoding = "async";
        }
      });
      // Only a standalone Bilibili video link becomes a player. Raw iframes stay stripped.
      visit(tree, "element", (node) => {
        if (node.tagName !== "p" || node.children.length !== 1) return;
        const link = node.children[0];
        if (link.type !== "element" || link.tagName !== "a") return;
        let url: URL;
        try { url = new URL(String(link.properties.href)); } catch { return; }
        if (url.protocol !== "https:" || !["www.bilibili.com", "bilibili.com"].includes(url.hostname)) return;
        const match = /^\/video\/(BV[A-Za-z0-9]{10})\/?$/.exec(url.pathname);
        if (!match) return;
        node.tagName = "div";
        node.properties = { className: ["video-block"] };
        node.children = [
          { type: "element", tagName: "div", properties: { className: ["video-embed"] }, children: [
            { type: "element", tagName: "button", properties: { type: "button", "data-bilibili": match[1], ariaLabel: "加载并播放 Bilibili 参考视频" }, children: [
              { type: "element", tagName: "span", properties: {}, children: [{ type: "text", value: "▶ 点击播放开篇参考视频" }] },
            ] },
          ] },
          { type: "element", tagName: "p", properties: { className: ["video-source"] }, children: [link] },
        ];
        return SKIP;
      });
    })
    .use(rehypeStringify).process(markdown));
  return { html, toc };
}
