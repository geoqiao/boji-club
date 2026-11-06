import { posts } from "../lib/content";
export const GET = () => new Response(JSON.stringify(posts.map(post => ({
  title: post.title, description: post.description, path: post.path,
  text: post.markdown.replace(/https?:\/\/\S+/g, "").replace(/[#*_`>|\[\]]/g, " ").replace(/\s+/g, " ").trim(),
}))), { headers: { "content-type": "application/json; charset=utf-8" } });
