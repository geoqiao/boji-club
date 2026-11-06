import { site } from "../lib/site";
export const GET = () => new Response("User-agent: *\nAllow: /\nSitemap: " + site.url + "sitemap.xml\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
