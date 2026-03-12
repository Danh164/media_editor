import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "vi"],
  defaultLocale: "en",
});

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for all requests that have a locale prefix
    '/(vi|en)/:path*',
    // Exclude Next.js internals, static files, and our custom /ffmpeg directory
    '/((?!_next|_vercel|.*\\..*|ffmpeg).*)'
  ],
};
