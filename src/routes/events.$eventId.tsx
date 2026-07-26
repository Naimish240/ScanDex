import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, ScanLine, Trash2 } from "lucide-react";
import { ContactThumb } from "@/components/ContactThumb";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event — ScanDex" },
      { name: "description", content: "Business cards collected at this event." },
      { property: "og:title", content: "Event — ScanDex" },
      { property: "og:description", content: "Business cards collected at this event." },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const id = Number(eventId);
  const navigate = useNavigate();
  const event = useLiveQuery(() => db.events.get(id), [id]);
  const contacts = useLiveQuery(
    () => db.contacts.where("eventId").equals(id).reverse().sortBy("createdAt"),
    [id],
  );

  async function remove() {
    if (!confirm("Delete this event and all its cards?")) return;
    await db.contacts.where("eventId").equals(id).delete();
    await db.events.delete(id);
    navigate({ to: "/events" });
  }

  if (!event) return <AppShell><div className="p-8 text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-6">
        <Link to="/events" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground mb-4">
          <ArrowLeft className="size-3.5" /> Events
        </Link>
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {new Date(event.date).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">{event.name}</h1>
            {event.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {event.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-secondary text-[10px] font-mono rounded">{t}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={remove} className="size-9 rounded-full grid place-items-center bg-secondary" aria-label="Delete event">
            <Trash2 className="size-4" />
          </button>
        </div>
      </header>

      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {contacts?.length ?? 0} cards
          </h2>
          <Link
            to="/scan"
            search={{ eventId: id }}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1.5"
          >
            <ScanLine className="size-3.5" /> Scan into event
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(contacts ?? []).map((c) => (
            <Link
              key={c.id}
              to="/contacts/$contactId"
              params={{ contactId: String(c.id) }}
              className="bg-card ring-1 ring-border rounded-2xl p-3"
            >
              <ContactThumb contact={c} />
              <p className="mt-2 text-sm font-semibold truncate">{c.name || "Untitled"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.company || c.title || "—"}</p>
            </Link>
          ))}
          {(contacts ?? []).length === 0 && (
            <div className="col-span-2 rounded-2xl border-2 border-dashed border-border p-8 text-center">
              <p className="text-xs text-muted-foreground">No cards yet. Tap Scan.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
