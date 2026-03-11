import { notFound } from "next/navigation";
import { isValidLang } from "@/lib/i18n/utils";
import { SetHtmlLang } from "@/components/set-html-lang";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!isValidLang(lang)) {
    notFound();
  }

  return (
    <>
      <SetHtmlLang lang={lang} />
      {children}
    </>
  );
}
