import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const middleware = createMiddleware(routing);

export const config = {
    // Match root and all pathnames except static files and Next.js internals
    matcher: ['/', '/((?!_next|_vercel|.*\\..*).*)'],
};

export default middleware;
