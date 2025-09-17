// src/components/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="flex h-16 items-center justify-center gap-6 border-t px-6 text-sm text-gray-600">
      <span className="whitespace-nowrap">
        &copy; {new Date().getFullYear()} By Alvin James
      </span>

      <Link
        href="https://github.com/ajdelossantos/job-search-tracker"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
        aria-label="View repository on GitHub"
      >
        <Image
          src="/assets/github-mark.svg"
          alt="GitHub"
          width={18}
          height={18}
          className="dark:invert"
        />
        <span className="hidden sm:inline">GitHub</span>
      </Link>
    </footer>
  );
}
