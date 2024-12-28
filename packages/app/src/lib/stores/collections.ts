import type { Collection } from '@clairvue/types';
import { writable } from 'svelte/store';

export const collectionsStore = writable<Collection[]>([]);
