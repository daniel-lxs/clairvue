import boardRepository from '@/server/data/repositories/board';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { validateAuthSession } from '@/server/services/auth';
import feedRepository from '@/server/data/repositories/feed';

export const load = (async ({ params: { slug }, cookies }) => {
	const cookieHeader = cookies.get('auth_session');

	if (!cookieHeader) {
		redirect(302, '/auth/login');
	}

	const authSession = await validateAuthSession(cookieHeader);

	if (!authSession) {
		redirect(302, '/auth/login');
	}

	const getBoard = async () => {
		const board = await boardRepository.findBySlug(authSession.user.id, slug, true);

		if (!board) {
			redirect(302, '/board/new');
		}

		if (board.feeds && board.feeds.length > 0) {
			board.feeds = await Promise.all(
				board?.feeds.map(async (feed) => {
					const articleCount = await feedRepository.countArticles(feed.id);
					return {
						...feed,
						articleCount
					};
				})
			);
		}

		return board;
	};

	return {
		streamed: {
			board: getBoard()
		}
	};
}) satisfies PageServerLoad;
