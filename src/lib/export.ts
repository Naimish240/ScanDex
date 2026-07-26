import type { ContactRow, EventRow } from "./db";

function esc(v: string | undefined) {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export function contactsToCSV(contacts: ContactRow[], events: EventRow[]): string {
  const evMap = new Map(events.map((e) => [e.id!, e.name]));
  const header = [
    "Name", "Title", "Company", "Email", "Phones",
    "Website", "LinkedIn", "Address", "Event", "Tags", "Notes", "CreatedAt",
  ];
  const rows = contacts.map((c) => [
    c.name, c.title, c.company, c.email,
    c.phones.join(" | "),
    c.website, c.linkedin, c.address,
    evMap.get(c.eventId) || "",
    c.tags.join(" | "),
    c.notes,
    new Date(c.createdAt).toISOString(),
  ].map(esc).join(","));
  return [header.join(","), ...rows].join("\n");
}

export function downloadFile(name: string, mime: string, content: string | Blob) {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
