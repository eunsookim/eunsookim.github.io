import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateBlogDraft(params: {
  topic: string;
  keyPoints: string[];
  references: string[];
  categorySlug?: string;
}): Promise<{ title: string; content: string; excerpt: string; tags: string[] }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `당신은 기술 블로그 작성자입니다. 다음 주제로 한국어 블로그 초안을 작성하세요.

주제: ${params.topic}
핵심 포인트:
${params.keyPoints.map((p) => `- ${p}`).join("\n")}
${params.references.length > 0 ? `참고 자료:\n${params.references.map((r) => `- ${r}`).join("\n")}` : ""}

요구사항:
1. 제목 (title): 매력적이고 SEO에 좋은 제목
2. 본문 (content): 마크다운 형식, h2/h3 구조, 코드 예제 포함
3. 요약 (excerpt): 2-3문장
4. 태그 (tags): 관련 태그 3-5개

JSON 형식으로 응답하세요:
{"title": "...", "content": "...", "excerpt": "...", "tags": ["..."]}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // JSON 파싱 (코드 블록 제거)
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let parsed: { title?: string; content?: string; excerpt?: string; tags?: string[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Gemini 응답을 JSON으로 파싱할 수 없습니다.");
  }

  if (!parsed.title || !parsed.content || !parsed.excerpt || !Array.isArray(parsed.tags)) {
    throw new Error("Gemini 응답에 필수 필드(title, content, excerpt, tags)가 누락되었습니다.");
  }

  return parsed as { title: string; content: string; excerpt: string; tags: string[] };
}
