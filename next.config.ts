import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    // IMPORTANT: Do NOT cache HTML navigation responses. When the PWA reopens,
    // we need the server (middleware + page.tsx) to run its SSR auth check and
    // redirect authenticated users to /home. Serving a cached HTML shell would
    // bypass that check and show the landing page to logged-in users.
    cacheOnFrontEndNav: false,
    aggressiveFrontEndNavCaching: false,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,

        // Bump cacheId whenever the SW caching strategy changes.
        // Workbox appends this to every cache name (e.g. "lockedin-v2-precache-*")
        // and cleanupOutdatedCaches() will nuke any "lockedin-v1-*" caches,
        // including the old "start-url" cache that used to serve landing-page HTML.
        cacheId: "lockedin-v2",

        // Force the new SW to activate immediately, even if old tabs are open.
        // Without this, users may run the old SW for days until they close every tab.
        skipWaiting: true,
        clientsClaim: true,

        // Purge precache entries whose revision no longer matches — prevents
        // outdated HTML shells from being served from the precache.
        cleanupOutdatedCaches: true,

        runtimeCaching: [
            {
                // All same-origin HTML navigations → ALWAYS hit the network.
                // This covers: /, /home, /tasks, /regimens, /achievements,
                // /journal, /chat, /calendar, /settings, /onboarding, /login, /signup
                //
                // CRITICAL: Never use NetworkFirst or CacheFirst for navigations —
                // that would serve a cached landing page instead of the SSR auth redirect.
                urlPattern: ({ request }: { request: Request }) =>
                    request.mode === "navigate",
                handler: "NetworkOnly" as const,
            },
            {
                // API routes must never be cached — auth state and data are dynamic.
                urlPattern: ({ url }: { url: URL }) =>
                    url.pathname.startsWith("/api/"),
                handler: "NetworkOnly" as const,
            },
        ],
    },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
