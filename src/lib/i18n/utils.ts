export const SUPPORTED_LANGS = ["ko", "en"] as const;
export const DEFAULT_LANG = "ko";
export type Lang = (typeof SUPPORTED_LANGS)[number];

export function isValidLang(lang: string): lang is Lang {
  return SUPPORTED_LANGS.includes(lang as Lang);
}
