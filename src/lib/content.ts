import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { renderMarkdown, type Heading } from "./markdown";
import { site } from "./site";

export interface Post {
  issueNumber: number;
  title: string;
  slug: string;
  description: string;
  createdDate: string;
  updateDate: string;
  markdown: string;
  path: string;
  html: string;
  toc: Heading[];
}
interface Manifest {
  export_version: number;
  repository: string;
  blog: { issue_number: number; slug: string; path: string }[];
}
const dir = resolve(process.env.CONTENT_DIR ?? "content");
const manifest = JSON.parse(readFileSync(resolve(dir, "manifest.json"), "utf8")) as Manifest;
if (manifest.export_version !== 1 || manifest.repository !== site.repo) {
  throw new Error("The content export version or repository does not match this site.");
}
export const posts: Post[] = await Promise.all(manifest.blog.map(async (entry) => {
  const source = readFileSync(resolve(dir, entry.path), "utf8");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!match) throw new Error("Missing front matter: " + entry.path);
  const data = parse(match[1]);
  if (data.issue_number !== entry.issue_number || data.slug !== entry.slug) throw new Error("Manifest mismatch: " + entry.path);
  const markdown = source.slice(match[0].length);
  return {
    issueNumber: data.issue_number, title: data.title, slug: data.slug,
    description: data.description, createdDate: data.created_date,
    updateDate: data.update_date, markdown, path: "/blog/" + data.slug + "/",
    ...await renderMarkdown(markdown),
  };
}));
