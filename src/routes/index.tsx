import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ArrowUpRight, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScanDex — Dashboard" },
      { name: "description", content: "Your local business card index. Recent events and quick stats." },
      { property: "og:title", content: "ScanDex — Dashboard" },
      { property: "og:description", content: "Your local business card index." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const events = useLiveQuery(() => db.events.orderBy("createdAt").reverse().toArray(), []);
  const contacts = useLiveQuery(() => db.contacts.toArray(), []);
  const total = contacts?.length ?? 0;
  const eventCount = events?.length ?? 0;
  const recentContacts = (contacts ?? []).slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  const countsByEvent = new Map<number, number>();
  contacts?.forEach((c) => countsByEvent.set(c.eventId, (countsByEvent.get(c.eventId) || 0) + 1));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Local / No cloud usage"
        title="SCANDEX"
        right={
          <Link
            to="/events"
            className="size-10 rounded-full bg-black text-white grid place-items-center shadow-lg"
            aria-label="New event"
          >
            <Plus className="size-4" />
          </Link>
        }
      />

      <section className="px-5 grid grid-cols-2 gap-3">
        <Stat label="Total Cards" value={total} />
        <Stat label="Events" value={eventCount} />
      </section>

      <section className="px-5 mt-8">
        <SectionHeading title="Recent Events" href="/events" />
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          {(events ?? []).slice(0, 6).map((ev) => (
            <Link
              key={ev.id}
              to="/events/$eventId"
              params={{ eventId: String(ev.id) }}
              className="flex-none w-48 p-4 bg-card ring-1 ring-border rounded-2xl"
            >
              <p className="font-mono text-[10px] text-primary mb-1">
                {new Date(ev.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}
              </p>
              <h3 className="font-bold text-sm leading-tight mb-3 line-clamp-2">{ev.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 bg-secondary text-[10px] font-mono rounded">
                  {countsByEvent.get(ev.id!) || 0} CARDS
                </span>
                {ev.location && (
                  <span className="px-1.5 py-0.5 bg-secondary text-[10px] font-mono rounded uppercase">
                    {ev.location}
                  </span>
                )}
              </div>
            </Link>
          ))}
          {(events ?? []).length === 0 && <EmptyEvents />}
        </div>
      </section>

      <section className="px-5 mt-8">
        <SectionHeading title="Recent Captures" href="/search" />
        <div className="space-y-2">
          {recentContacts.map((c) => (
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
                  {[c.title, c.company].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          {recentContacts.length === 0 && (
            <p className="text-xs font-mono text-muted-foreground">No captures yet. Tap the scan button.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card ring-1 ring-border rounded-2xl p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-extrabold tracking-tighter">{value.toLocaleString()}</p>
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <Link to={href} className="text-[11px] font-medium text-primary">View All</Link>
    </div>
  );
}

function EmptyEvents() {
  return (
    <Link
      to="/events"
      className="flex-none w-48 aspect-[4/3] p-4 border-2 border-dashed border-border rounded-2xl grid place-items-center text-center"
    >
      <div>
        <Plus className="size-5 mx-auto mb-1 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase text-muted-foreground">Create Event</span>
      </div>
    </Link>
  );
}
