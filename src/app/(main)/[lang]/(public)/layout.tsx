import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Lang } from "@/lib/i18n/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { lang } = await params;

  return (
    <div className="flex min-h-svh flex-col">
      <Header lang={lang as Lang} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang as Lang} />
    </div>
  );
}
