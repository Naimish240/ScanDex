import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, CalendarDays, ScanLine, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div 
        className="mx-auto w-full max-w-[440px] min-h-screen bg-background relative"
        style={{ 
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
          paddingTop: "env(safe-area-inset-top)"
        }}
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: { to: string; label: string; icon: typeof LayoutGrid; match: (p: string) => boolean }[] = [
    { to: "/", label: "Index", icon: LayoutGrid, match: (p) => p === "/" },
    { to: "/events", label: "Events", icon: CalendarDays, match: (p) => p.startsWith("/events") },
    { to: "/scan", label: "Scan", icon: ScanLine, match: (p) => p.startsWith("/scan") },
    { to: "/search", label: "Search", icon: Search, match: (p) => p.startsWith("/search") },
    { to: "/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/settings") },
  ];
  return (
    <nav 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40 px-4 pt-2 pointer-events-none"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto flex items-center justify-between gap-1 bg-black text-white rounded-full px-2 py-2 shadow-2xl ring-1 ring-white/10">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          if (it.to === "/scan") {
            return (
              <Link key={it.to} to={it.to} className="mx-1">
                <span className="grid place-items-center size-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-6 ring-4 ring-black">
                  <Icon className="size-5" />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full transition-colors ${
                active ? "text-white" : "text-white/40"
              }`}
            >
              <Icon className="size-4" />
              <span className="text-[9px] font-mono uppercase tracking-widest">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PageHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <header className="px-5 pt-10 pb-6">
      <div className="flex justify-between items-end">
        <div>
          {eyebrow && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-extrabold tracking-tighter">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  );
}
