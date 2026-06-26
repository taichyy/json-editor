import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match root and all pathnames except static files and Next.js internals
  matcher: ['/', '/((?!_next|_vercel|.*\\..*).*)'],
};
