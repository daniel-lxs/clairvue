import { writable } from 'svelte/store';

export type FontSize = 'small' | 'default' | 'large' | 'extra large';

export const fontSize = writable<FontSize>('default');
