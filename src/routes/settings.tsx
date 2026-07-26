import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppShell, PageHeader } from "@/components/AppShell";
import { contactsToCSV, downloadFile } from "@/lib/export";
import { Download, Trash2, ShieldCheck, HardDrive } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ScanDex" },
      { name: "description", content: "Export contacts, manage local storage, and review privacy settings." },
      { property: "og:title", content: "Settings — ScanDex" },
      { property: "og:description", content: "Export contacts and manage local storage." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];

  async function exportCSV() {
    const csv = contactsToCSV(contacts, events);
    downloadFile(`scandex-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv", csv);
  }

  async function wipe() {
    if (!confirm("Delete ALL contacts and events? This cannot be undone.")) return;
    await db.contacts.clear();
    await db.events.clear();
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Local device only" title="Settings" />

      <section className="px-5">
        <Group title="Privacy">
          <Row
            icon={ShieldCheck}
            title="Offline-only mode"
            subtitle="All data stays on this device. No accounts, no sync."
            trailing={<span className="text-[10px] font-mono text-primary">ACTIVE</span>}
          />
          <Row
            icon={HardDrive}
            title="Local storage"
            subtitle={`${contacts.length} contacts · ${events.length} events`}
          />
        </Group>

        <Group title="Export">
          <button onClick={exportCSV} className="w-full flex items-center gap-3 p-4 bg-card ring-1 ring-border rounded-2xl">
            <Download className="size-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Export all as CSV</p>
              <p className="text-xs text-muted-foreground">Open in spreadsheets or CRM import.</p>
            </div>
          </button>
        </Group>

        <Group title="OCR">
          <div className="p-4 bg-card ring-1 ring-border rounded-2xl">
            <p className="text-sm font-semibold mb-1">Recognition engine</p>
            <p className="text-xs text-muted-foreground">
              Tesseract.js runs in the browser. English model. Downloads once, then caches for offline use.
            </p>
          </div>
        </Group>

        <Group title="Danger zone">
          <button onClick={wipe} className="w-full flex items-center gap-3 p-4 bg-card ring-1 ring-destructive/20 rounded-2xl text-destructive">
            <Trash2 className="size-5" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Delete all data</p>
              <p className="text-xs opacity-70">Wipe local storage. Cannot be undone.</p>
            </div>
          </button>
        </Group>

        <p className="text-center text-[10px] font-mono text-muted-foreground mt-8 uppercase tracking-widest">
          ScanDex · Local Build
        </p>
      </section>
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, title, subtitle, trailing }: { icon: typeof ShieldCheck; title: string; subtitle: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card ring-1 ring-border rounded-2xl">
      <Icon className="size-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}
