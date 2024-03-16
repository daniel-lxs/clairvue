import boardRepository from '@/server/data/repositories/board';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { validateAuthSession } from '@/server/services/auth';

export const load = (async ({ params: { slug }, cookies }) => {
	const cookieHeader = cookies.get('auth_session');

	if (!cookieHeader) {
		redirect(302, '/auth/login');
	}

	const authSession = await validateAuthSession(cookieHeader);

	if (!authSession) {
		redirect(302, '/auth/login');
	}

	const board = await boardRepository.findBySlug(authSession.user.id, slug, true);

	if (!board) {
		redirect(302, '/board/new');
	}

	return {
		board
	};
}) satisfies PageServerLoad;
