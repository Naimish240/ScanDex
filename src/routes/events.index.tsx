import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/lib/db";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Plus, Calendar, MapPin, X } from "lucide-react";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — ScanDex" },
      { name: "description", content: "Organize business cards by conference, trade show, or client meeting." },
      { property: "og:title", content: "Events — ScanDex" },
      { property: "og:description", content: "Organize business cards by event." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const events = useLiveQuery(() => db.events.orderBy("date").reverse().toArray(), []);
  const contacts = useLiveQuery(() => db.contacts.toArray(), []);
  const [open, setOpen] = useState(false);

  const counts = new Map<number, number>();
  contacts?.forEach((c) => counts.set(c.eventId, (counts.get(c.eventId) || 0) + 1));

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${events?.length ?? 0} scopes`}
        title="Events"
        right={
          <button
            onClick={() => setOpen(true)}
            className="size-10 rounded-full bg-black text-white grid place-items-center shadow-lg"
            aria-label="New event"
          >
            <Plus className="size-4" />
          </button>
        }
      />
      <section className="px-5 space-y-3">
        {(events ?? []).map((ev) => (
          <Link
            key={ev.id}
            to="/events/$eventId"
            params={{ eventId: String(ev.id) }}
            className="block bg-card ring-1 ring-border rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight truncate">{ev.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(ev.date).toLocaleDateString()}
                  </span>
                  {ev.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {ev.location}
                    </span>
                  )}
                </div>
                {ev.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {ev.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-secondary text-[10px] font-mono rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold tracking-tight">{counts.get(ev.id!) || 0}</p>
                <p className="font-mono text-[9px] uppercase text-muted-foreground">Cards</p>
              </div>
            </div>
          </Link>
        ))}
        {(events ?? []).length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium mb-1">No events yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create one to start organizing cards.</p>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold rounded-full px-4 py-2"
            >
              <Plus className="size-3.5" /> New Event
            </button>
          </div>
        )}
      </section>
      {open && <NewEventDialog onClose={() => setOpen(false)} />}
    </AppShell>
  );
}

export function NewEventDialog({ onClose, onCreated }: { onClose: () => void; onCreated?: (id: number) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await db.events.add({
      name: name.trim(),
      date,
      location: location.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: Date.now(),
    });
    onCreated?.(Number(id));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-[440px] bg-background rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New Event</h2>
          <button type="button" onClick={onClose} className="size-8 rounded-full grid place-items-center bg-secondary">
            <X className="size-4" />
          </button>
        </div>
        <Field label="Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tech Expo 2027" className="input" />
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </Field>
        <Field label="Location">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Seoul" className="input" />
        </Field>
        <Field label="Tags (comma separated)">
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fintech, vip" className="input" />
        </Field>
        <button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-2xl">
          Create Event
        </button>
        <style>{`.input{width:100%;padding:.65rem .85rem;background:var(--secondary);border-radius:.65rem;font-size:.875rem;outline:none;border:1px solid transparent}.input:focus{border-color:var(--primary)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
