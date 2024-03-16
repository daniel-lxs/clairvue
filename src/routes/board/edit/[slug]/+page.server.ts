import boardRepository from '@/server/data/repositories/board';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params: { slug } }) => {
	const board = await boardRepository.findBySlug(slug, true);

	if (!board) {
		redirect(302, '/board/new');
	}

	return {
		board
	};
};
