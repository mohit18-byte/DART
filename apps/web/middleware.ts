import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk middleware — protects API and dashboard routes.
 * Public routes: landing, pricing, changelog, health.
 *
 * Phase 3: Middleware is configured but not enforced
 * (using placeholder auth). Phase 5 enables enforcement.
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/changelog',
  '/api/health',
  // Phase 3: Allow agent API without auth for testing
  '/api/agent/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
