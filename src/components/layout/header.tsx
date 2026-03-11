"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/i18n/utils"
import { getMessages } from "@/lib/i18n/messages"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <span className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4 transition-transform" />
      ) : (
        <Moon className="size-4 transition-transform" />
      )}
    </Button>
  )
}

function LanguageToggle({ lang, switchHref }: { lang: Lang; switchHref: string }) {
  const messages = getMessages(lang)

  const handleSwitch = () => {
    const otherLang = lang === "ko" ? "en" : "ko"
    document.cookie = `preferred-lang=${otherLang}; path=/; max-age=${60 * 60 * 24 * 365}`
    window.location.href = switchHref
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Switch language" onClick={handleSwitch}>
      <span className="text-xs font-bold">{messages.lang.toggle}</span>
    </Button>
  )
}

interface HeaderProps {
  lang: Lang
}

export function Header({ lang }: HeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const messages = getMessages(lang)
  const navLinks = [
    { href: `/${lang}/blog`, label: messages.nav.blog },
    { href: `/${lang}/portfolio`, label: messages.nav.portfolio },
    { href: `/${lang}/about`, label: messages.nav.about },
  ]

  const otherLang = lang === "ko" ? "en" : "ko"
  const switchHref = pathname?.replace(`/${lang}`, `/${otherLang}`) ?? `/${otherLang}`

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={`/${lang}`}
          className="font-mono text-lg font-bold tracking-tight text-primary transition-colors hover:text-primary/80"
        >
          eunsookim.dev
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-primary",
                pathname?.startsWith(link.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <LanguageToggle lang={lang} switchHref={switchHref} />
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageToggle lang={lang} switchHref={switchHref} />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="font-mono text-primary">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4">
                {navLinks.map((link) => (
                  <SheetClose key={link.href} render={<span />}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
                        pathname?.startsWith(link.href)
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
