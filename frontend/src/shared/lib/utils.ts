import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Блок объединяет CSS-классы и корректно мерджит Tailwind-утилиты.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
