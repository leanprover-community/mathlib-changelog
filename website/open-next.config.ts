import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Changelog pages are prerendered at build time and served from the Worker's
// static assets. Commit and item pages are rendered per request and are not
// stored: the static assets cache is read-only, and it logs an error on every
// write, so writes are dropped here instead. Keep `name`, which OpenNext's
// populateCache step uses to copy the prerendered pages into the assets.
const readOnlyStaticAssetsCache = {
  name: staticAssetsIncrementalCache.name,
  get: staticAssetsIncrementalCache.get.bind(staticAssetsIncrementalCache),
  set: async () => {},
  delete: async () => {},
};

export default defineCloudflareConfig({
  incrementalCache: readOnlyStaticAssetsCache,
});
