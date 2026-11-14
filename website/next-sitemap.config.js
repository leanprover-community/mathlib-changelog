// This is hacky, but I can't import typescript database in here
// and the sitemap apparently only works with plain JS :/
// NOTE: `yarn build:search` must be run before the sitemap can be generated

const searchItems = require("./public/searchItems.json");

const itemTypesMap = {
  d: "def",
  t: "theorem",
  i: "inductive",
  s: "structure",
};

// Crawlers that made a large share of requests (Vercel Observability, Nov 2026)
// without serving readers: Google's non-Search crawler and SEO backlink tools.
// Blocking GoogleOther does not affect Google Search, which uses Googlebot.
const blockedCrawlers = [
  "GoogleOther",
  "SERankingBacklinksBot",
  "SemrushBot",
  "SemrushBot-BA",
  "SemrushBot-SI",
  "SiteAuditBot",
  "AhrefsBot",
  "AhrefsSiteAudit",
];

module.exports = {
  siteUrl: process.env.SITE_URL || "https://mathlib-changelog.org",
  generateRobotsTxt: true, // (optional)
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      ...blockedCrawlers.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
  },
  additionalPaths: async (config) =>
    searchItems.map((item) => {
      const fullName = item.replace(/^[a-z]+:/i, "");
      return { loc: `/${itemTypesMap[item[0]]}/${fullName}` };
    }),
};
