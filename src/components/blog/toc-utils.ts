import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractTocItems(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugger.slug(text);
    items.push({ id, text, level });
  }
  return items;
}
