"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Cursor Chat Browser</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" asChild>
              <Link href="/export">Export</Link>
            </Button>
            {pathname.startsWith('/export') && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
} 