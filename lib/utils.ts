import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn's canonical class merger. `clsx` builds the list, `tailwind-merge`
 * resolves conflicts so a caller's `px-6` beats a component's default `px-4`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
