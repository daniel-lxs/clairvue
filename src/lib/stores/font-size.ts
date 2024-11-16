import { writable } from 'svelte/store';

export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export const fontSize = writable<FontSize>('base');
