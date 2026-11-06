import { defineConfig } from "astro/config";
import checkLinks from "./src/integrations/check-links.mjs";

export default defineConfig({
  site: "https://boji-club.geoqiao.me/",
  trailingSlash: "always",
  build: { format: "directory" },
  devToolbar: { enabled: false },
  integrations: [checkLinks()],
});
