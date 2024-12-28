import { writable } from 'svelte/store';

export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

const storedSize = typeof window !== 'undefined' ? localStorage.getItem('fontSize') as FontSize : 'base';
export const fontSize = writable<FontSize>(storedSize || 'base');
export let previousFontSize: FontSize = storedSize || 'base';

export function updateFontSize(newSize: FontSize | undefined) {
    if (newSize === undefined || newSize === previousFontSize) {
        return;
    }
    previousFontSize = newSize;
    fontSize.set(newSize);
    if (typeof window !== 'undefined') {
        localStorage.setItem('fontSize', newSize);
    }
}
