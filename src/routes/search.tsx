import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Search as SearchIcon, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — ScanDex" },
      { name: "description", content: "Search across every extracted contact field. Filter by event, company, or tags." },
      { property: "og:title", content: "Search — ScanDex" },
      { property: "og:description", content: "Search across every extracted contact field." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];
  const evMap = new Map(events.map((e) => [e.id!, e]));

  const [q, setQ] = useState("");
  const [eventFilter, setEventFilter] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (eventFilter !== "all" && c.eventId !== eventFilter) return false;
      if (!query) return true;
      const hay = [c.name, c.title, c.company, c.email, c.website, c.linkedin, c.address, c.notes, ...(c.phones || []), ...(c.tags || []), c.rawText]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [contacts, q, eventFilter]);

  // Duplicate detection: same email OR same normalized name+company
  const dupes = useMemo(() => {
    const seen = new Map<string, number[]>();
    contacts.forEach((c) => {
      const keys: string[] = [];
      if (c.email) keys.push("e:" + c.email.toLowerCase());
      if (c.name && c.company) keys.push("nc:" + (c.name + "|" + c.company).toLowerCase().replace(/\s+/g, ""));
      keys.forEach((k) => {
        const arr = seen.get(k) || [];
        arr.push(c.id!);
        seen.set(k, arr);
      });
    });
    return Array.from(seen.entries()).filter(([, ids]) => ids.length > 1);
  }, [contacts]);

  return (
    <AppShell>
      <PageHeader eyebrow={`${contacts.length} contacts indexed`} title="Search" />
      <section className="px-5">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, company, email, tag…"
            className="w-full pl-10 pr-4 py-3 bg-card ring-1 ring-border rounded-xl text-sm outline-none focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1 mt-3">
          <FilterChip active={eventFilter === "all"} onClick={() => setEventFilter("all")}>All</FilterChip>
          {events.map((ev) => (
            <FilterChip key={ev.id} active={eventFilter === ev.id} onClick={() => setEventFilter(ev.id!)}>
              {ev.name}
            </FilterChip>
          ))}
        </div>
      </section>

      {dupes.length > 0 && (
        <section className="px-5 mt-5">
          <div className="rounded-xl bg-secondary ring-1 ring-border p-3 flex items-start gap-3">
            <AlertTriangle className="size-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-bold">{dupes.length} potential duplicate group{dupes.length > 1 ? "s" : ""}</p>
              <p className="text-[11px] text-muted-foreground">Contacts sharing the same email or name+company.</p>
            </div>
          </div>
        </section>
      )}

      <section className="px-5 mt-5 space-y-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            to="/contacts/$contactId"
            params={{ contactId: String(c.id) }}
            className="flex items-center gap-3 p-3 bg-card ring-1 ring-border rounded-xl"
          >
            <div className="size-10 rounded-lg bg-secondary grid place-items-center font-mono text-xs text-muted-foreground">
              {(c.name || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{c.name || "Untitled"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[c.title, c.company].filter(Boolean).join(" · ") || c.email || "—"}
              </p>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground uppercase">
              {evMap.get(c.eventId)?.name?.slice(0, 12)}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8 font-mono">No matches</p>
        )}
      </section>
    </AppShell>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-none px-3 py-1.5 rounded-full text-[11px] font-mono whitespace-nowrap ${
        active ? "bg-black text-white" : "bg-secondary text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
