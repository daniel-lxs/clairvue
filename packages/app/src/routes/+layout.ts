import type { LayoutLoad } from './$types';
import { collectionsStore } from '@/stores/collections';
import { feedsStore } from '@/stores/feeds';

export const load: LayoutLoad = async ({ data }) => {
  if (data) {
    collectionsStore.set(data.collections);
    feedsStore.set(data.feeds);
  }
  return data;
};
