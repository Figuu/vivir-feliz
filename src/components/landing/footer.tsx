import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto max-w-[64rem] px-8">
        <div className="flex flex-col items-center justify-between gap-4 py-6 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2 md:items-start">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by{' '}
              <Link
                href="https://github.com/yourusername"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Your Name
              </Link>
              . The source code is available on{' '}
              <Link
                href="https://github.com/yourusername/boring-skale-next"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                GitHub
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="https://github.com/yourusername/boring-skale-next"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link
              href="https://twitter.com/yourusername"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}