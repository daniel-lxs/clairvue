import type { Feed } from '@clairvue/types';
import { writable } from 'svelte/store';

export const feedsStore = writable<Feed[]>([]);
