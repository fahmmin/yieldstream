import Link from "next/link";
import { LogoIcon } from "./LogoIcon";

const NAV_LINKS = [
  { label: "Network", href: "#network" },
  { label: "Treasury", href: "/treasury" },
  { label: "Ball Big", href: "#ball-big" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Docs", href: "https://developers.stellar.org/docs" },
  { label: "Help", href: "#help" },
] as const;

export function Navbar() {
  return (
    <nav className="absolute left-0 right-0 top-0 z-20 px-6 py-5">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoIcon className="h-7 w-7 text-black" />
          <span className="text-2xl font-medium tracking-tight text-black">YieldStream</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-base font-medium text-gray-700 transition-colors duration-200 hover:text-black"
              {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/treasury"
          className="rounded-full bg-black px-7 py-2.5 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800"
        >
          Open Treasury
        </Link>
      </div>
    </nav>
  );
}
