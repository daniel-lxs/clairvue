import boardRepository from '@/server/data/repositories/board';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { validateAuthSession } from '@/server/services/auth';
import rssFeedRepository from '@/server/data/repositories/rssFeed';

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

		if (board.rssFeeds && board.rssFeeds.length > 0) {
			board.rssFeeds = await Promise.all(
				board?.rssFeeds.map(async (rssFeed) => {
					const articleCount = await rssFeedRepository.countArticles(rssFeed.id);
					return {
						...rssFeed,
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
