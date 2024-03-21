import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export function calculateAge(date: Date | string, format: 'short' | 'long' = 'short'): string {
  if (typeof date === 'string') date = new Date(date);

	const now = new Date();
	const timeDifference = now.getTime() - date.getTime();
	const minutes = Math.floor(timeDifference / (1000 * 60));
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30.4375);
	const years = Math.floor(months / 12);

	if (format === 'long') {
		if (years > 0) return `${years} year${years !== 1 ? 's' : ''} ago`;
		if (months > 0) return `${months} month${months !== 1 ? 's' : ''} ago`;
		if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
		if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
		return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
	}

	if (years > 0) return `${years}y ago`;
	if (months > 0) return `${months}M ago`;
	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes === 0) return 'now';
	return `${minutes}m ago`;
}

export function truncateDescription(description: string, maxLength: number = 160) {
	if (description.length <= maxLength) return description;

	const words = description.split(' ');
	let truncatedDescription = '';

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const newLength = truncatedDescription.length + word.length;

		if (newLength <= maxLength) {
			truncatedDescription += `${word} `;
		} else {
			let result = truncatedDescription.trim();
			if (result.endsWith(',')) {
				result = result.slice(0, -1);
			}
			return `${result}`;
		}
	}

	return truncatedDescription.trim();
}
