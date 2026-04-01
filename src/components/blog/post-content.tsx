import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

// Extend the default sanitize schema to allow rehype-pretty-code attributes
const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      "data-language",
      "data-theme",
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      "data-line",
      "class",
    ],
    pre: [
      ...(defaultSchema.attributes?.pre || []),
      "data-language",
      "data-theme",
      "class",
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      "data-rehype-pretty-code-fragment",
      "data-rehype-pretty-code-title",
      "class",
    ],
    figure: [
      ...(defaultSchema.attributes?.figure || []),
      "data-rehype-pretty-code-figure",
      "class",
    ],
    figcaption: [
      ...(defaultSchema.attributes?.figcaption || []),
      "data-rehype-pretty-code-title",
      "class",
    ],
    h1: [...(defaultSchema.attributes?.h1 || []), "id"],
    h2: [...(defaultSchema.attributes?.h2 || []), "id"],
    h3: [...(defaultSchema.attributes?.h3 || []), "id"],
  },
};

interface PostContentProps {
  content: string;
}

async function processMarkdown(markdown: string): Promise<string> {
  // Pipeline order: pretty-code BEFORE sanitize so that all HTML output from
  // the syntax highlighter is properly sanitized. The custom sanitizeSchema
  // allows the specific attributes that rehype-pretty-code adds.
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: "one-dark-pro",
      keepBackground: true,
    })
    .use(rehypeSanitize, sanitizeSchema)
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
        [&_pre_code]:text-inherit [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
        prose-hr:border-border
        prose-th:text-foreground prose-td:text-foreground/90
        prose-img:rounded-lg prose-img:border prose-img:border-border"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
