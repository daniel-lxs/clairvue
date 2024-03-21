import boardRepository from '@/server/data/repositories/board';
import articlesRepository from '@/server/data/repositories/article';
import { redirect } from '@sveltejs/kit';
import { validateAuthSession } from '@/server/services/auth';

export async function load({ params: { slug }, cookies }) {
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
		board,
		articles: articlesRepository.findByBoardId(board.id, 0, 20)
	};
}
