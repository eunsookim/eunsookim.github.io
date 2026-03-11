import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

interface PostContentProps {
  content: string;
}

async function processMarkdown(markdown: string): Promise<string> {
  // Pipeline order: sanitize BEFORE pretty-code so syntax highlighting
  // attributes (data-theme, style, span elements) are not stripped.
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypePrettyCode, {
      theme: "one-dark-pro",
      keepBackground: true,
    })
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

export default async function PostContent({ content }: PostContentProps) {
  // Content is sanitized via rehype-sanitize in the processing pipeline
  const html = await processMarkdown(content);

  return (
    <article
      className="prose prose-neutral dark:prose-invert max-w-none
        prose-headings:text-foreground
        prose-p:text-foreground/90
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-code:text-primary prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#282c34] prose-pre:border prose-pre:border-border prose-pre:rounded-lg
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
        prose-hr:border-border
        prose-th:text-foreground prose-td:text-foreground/90
        prose-img:rounded-lg prose-img:border prose-img:border-border"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
