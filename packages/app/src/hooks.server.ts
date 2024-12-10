import { resolve } from 'path';
import { startScheduler } from './lib/server/scheduler';
import config from '@/config';
import authService from '@/server/services/auth.service';
import { redirect, type Handle } from '@sveltejs/kit';
import type { Session, User } from '@clairvue/types';

const onStartup = () => {
  if (config.app.env !== 'build') {
    console.log('🚀 Server started');
    startScheduler();
  }
};
onStartup();

export const handle: Handle = async ({ event, resolve }) => {
  const requestedPath = event.url.pathname;
  const cookies = event.cookies;
  const unprotectedRoutes = ['/auth'];

  const isProtectedRoute = !unprotectedRoutes.some(route => requestedPath.startsWith(route));

  if (isProtectedRoute) {
    const authSessionResult = await authService.validateAuthSession(cookies);

    if (authSessionResult.isOkAnd((authSession) => !authSession || !authSession.user)) {
      throw redirect(302, '/auth/login');
    }
    event.locals.authSession = authSessionResult.unwrap() as {
      session: Session;
      user: User;
    };
  }

  return resolve(event);
};
