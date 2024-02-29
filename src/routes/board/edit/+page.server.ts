import type { PageServerLoad } from './$types';
import boardRepository from '@/server/data/repositories/board';

export const load: PageServerLoad = async ({ url }) => {
	const slug = url.searchParams.get('slug');

	if (!slug) {
		return {
			board: undefined
		};
	}

	const board = await boardRepository.findBySlug(slug, true);

	if (!board) {
		return {
			board: undefined
		};
	}

	return {
		board
	};
};
