import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk middleware — Phase 5: Full auth enforcement.
 *
 * Public routes: marketing pages, webhooks, health
 * Protected routes: dashboard, agent API, task API
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/changelog',
  '/download',
  '/api/health',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
