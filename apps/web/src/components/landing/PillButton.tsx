import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PillButtonProps = {
  label: string;
  href: string;
  size?: "base" | "lg";
};

export function PillButton({ label, href, size = "lg" }: PillButtonProps) {
  const textSize = size === "lg" ? "text-base md:text-lg" : "text-base";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full bg-black py-2 pl-8 pr-2 font-medium text-white transition-colors duration-200 hover:bg-gray-800 ${textSize}`}
    >
      {label}
      <span className="rounded-full bg-white p-2 transition-colors duration-200 group-hover:bg-white">
        <ArrowRight className="h-5 w-5 text-black" />
      </span>
    </Link>
  );
}
