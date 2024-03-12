import boardRepository from '@/server/data/repositories/board';
import { lucia } from '@/server/services/auth';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const cookieHeader = cookies.get('auth_session');
	if (!cookieHeader) {
		return {
			boards: undefined
		};
	}

	const sessionId = lucia.readSessionCookie(`auth_session=${cookieHeader}`);
	if (!sessionId) {
		return {
			boards: undefined
		};
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (!session || !user || session.expiresAt < new Date()) {
		return {
			boards: undefined
		};
	}
	console.log(user);
	return {
		boards: await boardRepository.findBoardsByUserId(user.id)
	};
}) satisfies PageServerLoad;
