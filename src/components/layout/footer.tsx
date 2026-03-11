import type { Lang } from "@/lib/i18n/utils"
import { getMessages } from "@/lib/i18n/messages"

interface FooterProps {
  lang: Lang
}

export function Footer({ lang }: FooterProps) {
  const messages = getMessages(lang)
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 py-6">
      <div className="mx-auto max-w-4xl px-4 text-center font-mono text-sm text-muted-foreground">
        {messages.footer.copyright.replace("{year}", String(year))}
      </div>
    </footer>
  )
}
