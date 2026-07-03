"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Live Map" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 border-b border-neutral-800 bg-neutral-950 px-6 py-3">
      <span className="text-sm font-bold tracking-tight text-white">
        Transit<span className="text-emerald-400">Pulse</span>
      </span>
      <div className="flex gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}