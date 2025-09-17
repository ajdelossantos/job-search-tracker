import Link from "next/link";
import { Briefcase, Users, Calendar } from "lucide-react";
import TimezoneSelect from "@/components/timezone/TimezoneSelect";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-6">
        {/* Left: Logo */}
        <Link
          href="/applications"
          className="flex items-center gap-2 font-semibold"
        >
          <Briefcase className="h-5 w-5" aria-hidden />
          <span className="text-lg">Job Search Tracker</span>
        </Link>

        {/* Right: Primary nav (desktop/tablet) */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Users className="h-4 w-4" aria-hidden />
            Contacts
          </Link>
          <Link
            href="/interviews"
            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Calendar className="h-4 w-4" aria-hidden />
            Interviews
          </Link>
          <TimezoneSelect />
        </nav>
      </div>
    </header>
  );
}
