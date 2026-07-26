import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db, blobToDataURL } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import {
  ArrowLeft, Phone, Mail, Globe, Linkedin, Search as SearchIcon,
  Trash2, Save, Share2,
} from "lucide-react";
import { VoiceRecorderWidget } from "@/components/VoiceRecorder";

export const Route = createFileRoute("/contacts/$contactId")({
  head: () => ({
    meta: [
      { title: "Contact — ScanDex" },
      { name: "description", content: "Contact dossier with extracted fields, original scan, and quick actions." },
      { property: "og:title", content: "Contact — ScanDex" },
      { property: "og:description", content: "Contact dossier." },
    ],
  }),
  component: Dossier,
});

function Dossier() {
  const { contactId } = Route.useParams();
  const id = Number(contactId);
  const navigate = useNavigate();
  const c = useLiveQuery(() => db.contacts.get(id), [id]);
  const event = useLiveQuery(async () => (c ? db.events.get(c.eventId) : undefined), [c?.eventId]);

  const [frontUrl, setFrontUrl] = useState<string>();
  const [portraitUrl, setPortraitUrl] = useState<string>();
  const [form, setForm] = useState<Partial<NonNullable<typeof c>>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!c) return;
    setForm(c);
    blobToDataURL(c.frontImage).then(setFrontUrl);
    blobToDataURL(c.profileImage).then(setPortraitUrl);
  }, [c?.id]);

  if (!c) return <AppShell><div className="p-8 text-sm text-muted-foreground">Loading…</div></AppShell>;

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  }

  async function save() {
    await db.contacts.update(id, { ...form, updatedAt: Date.now() });
    setDirty(false);
  }

  async function remove() {
    if (!confirm("Delete this contact?")) return;
    await db.contacts.delete(id);
    navigate({ to: "/events/$eventId", params: { eventId: String(c!.eventId) } });
  }

  function shareEmail() {
    const c2 = { ...c, ...form };
    const body = [
      c2.name, c2.title, c2.company, "",
      c2.email && `Email: ${c2.email}`,
      c2.phones?.length && `Phone: ${c2.phones.join(", ")}`,
      c2.website && `Website: ${c2.website}`,
      c2.linkedin && `LinkedIn: ${c2.linkedin}`,
      c2.address && `Address: ${c2.address}`,
      "",
      c2.notes && `Notes: ${c2.notes}`,
    ].filter(Boolean).join("\n");
    const subject = `Contact: ${c2.name}`;
    location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const phones = form.phones || [];

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <Link
            to="/events/$eventId"
            params={{ eventId: String(c.eventId) }}
            className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground"
          >
            <ArrowLeft className="size-3.5" /> {event?.name || "Back"}
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={shareEmail} className="size-9 rounded-full grid place-items-center bg-secondary" aria-label="Share via email">
              <Share2 className="size-4" />
            </button>
            <button onClick={remove} className="size-9 rounded-full grid place-items-center bg-secondary" aria-label="Delete">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Card image */}
      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-0.5 bg-black text-white text-[9px] font-mono rounded uppercase tracking-widest">
            Original Capture
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            #{String(c.id).padStart(4, "0")}
          </span>
        </div>
        <div className="w-full aspect-[1.6/1] rounded-xl overflow-hidden bg-secondary ring-1 ring-border">
          {frontUrl ? (
            <img src={frontUrl} alt={`Business card for ${c.name}`} className="w-full h-full object-cover" />
          ) : (
            <div className="grid place-items-center h-full text-[10px] font-mono text-muted-foreground">
              No image
            </div>
          )}
        </div>
      </section>

      {/* Profile */}
      <section className="px-5 mt-6">
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-2xl bg-secondary ring-1 ring-border overflow-hidden flex-none grid place-items-center">
            {portraitUrl ? (
              <img src={portraitUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-mono text-lg font-bold text-muted-foreground">
                {(form.name || "?").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <input
              className="w-full text-xl font-bold tracking-tight bg-transparent outline-none border-b border-transparent focus:border-primary"
              value={form.name || ""}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Name"
            />
            <input
              className="w-full text-sm text-muted-foreground bg-transparent outline-none border-b border-transparent focus:border-primary"
              value={form.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Title"
            />
            <input
              className={`w-full text-sm font-medium bg-transparent outline-none border-b pb-1 focus:border-primary ${
                !form.company ? "border-destructive placeholder:text-destructive/70" : "border-transparent"
              }`}
              value={form.company || ""}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Company (Required)"
            />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-5 mt-5 grid grid-cols-5 gap-2">
        <ActionButton disabled={!phones[0]} onClick={() => phones[0] && (location.href = `tel:${phones[0]}`)} icon={Phone} label="Call" />
        <ActionButton disabled={!form.email} onClick={() => form.email && (location.href = `mailto:${form.email}`)} icon={Mail} label="Email" />
        <ActionButton disabled={!form.website} onClick={() => form.website && window.open(normalizeUrl(form.website), "_blank")} icon={Globe} label="Web" />
        <ActionButton disabled={!form.linkedin} onClick={() => form.linkedin && window.open(normalizeLinkedIn(form.linkedin), "_blank")} icon={Linkedin} label="LinkedIn" />
        <ActionButton disabled={!form.company} onClick={() => form.company && window.open(`https://www.google.com/search?q=${encodeURIComponent(form.company)}`, "_blank")} icon={SearchIcon} label="Search" />
      </section>

      {/* Fields */}
      <section className="px-5 mt-6 space-y-4">
        <FieldRow label="Email" value={form.email || ""} onChange={(v) => update("email", v)} type="email" />
        {phones.map((p, i) => (
          <FieldRow
            key={i}
            label={i === 0 ? "Phone" : `Phone ${i + 1}`}
            value={p}
            onChange={(v) => {
              const next = [...phones];
              next[i] = v;
              update("phones", next);
            }}
          />
        ))}
        <button
          onClick={() => update("phones", [...phones, ""])}
          className="text-[11px] font-mono text-primary uppercase tracking-widest"
        >
          + Add phone
        </button>
        <FieldRow label="Website" value={form.website || ""} onChange={(v) => update("website", v)} />
        <FieldRow label="LinkedIn" value={form.linkedin || ""} onChange={(v) => update("linkedin", v)} />
        <FieldRow label="Address" value={form.address || ""} onChange={(v) => update("address", v)} multiline />
        <FieldRow label="Notes" value={form.notes || ""} onChange={(v) => update("notes", v)} multiline />
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Tags</label>
          <input
            className="w-full text-sm bg-secondary rounded-lg px-3 py-2 outline-none border border-transparent focus:border-primary"
            value={(form.tags || []).join(", ")}
            onChange={(e) => update("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
            placeholder="vip, follow-up"
          />
        </div>
        
        <VoiceRecorderWidget voiceNote={form.voiceNote} onChange={(b) => update("voiceNote", b)} />
      </section>

      {dirty && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={save}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg"
          >
            <Save className="size-4" /> Save changes
          </button>
        </div>
      )}
    </AppShell>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled }: { icon: typeof Phone; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card ring-1 ring-border disabled:opacity-40"
    >
      <Icon className="size-4" />
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function FieldRow({ label, value, onChange, type = "text", multiline }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm border-b border-border pb-1 bg-transparent outline-none focus:border-primary resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm border-b border-border pb-1 bg-transparent outline-none focus:border-primary"
        />
      )}
    </div>
  );
}

function normalizeUrl(u: string) {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}
function normalizeLinkedIn(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("linkedin.com")) return `https://${u}`;
  if (u.startsWith("in/")) return `https://linkedin.com/${u}`;
  return `https://linkedin.com/${u.replace(/^\/+/, "")}`;
}
