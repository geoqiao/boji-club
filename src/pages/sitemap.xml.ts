import { posts } from "../lib/content";
import { site } from "../lib/site";
export const GET = () => new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  ["/", ...posts.map(p => p.path)].map(path => "<url><loc>" + new URL(path, site.url).href + "</loc></url>").join("") +
  "</urlset>", { headers: { "content-type": "application/xml; charset=utf-8" } });
