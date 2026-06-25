import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
}, { signInUrl: "/login" });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico).*)",
  ],
};
