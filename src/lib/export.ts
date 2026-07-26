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

import JSZip from "jszip";
import { Share } from "@capacitor/share";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export async function exportFullDataZip(contacts: ContactRow[], events: EventRow[]) {
  const zip = new JSZip();
  
  // 1. Add CSV
  const csvContent = contactsToCSV(contacts, events);
  zip.file("contacts.csv", csvContent);

  // 2. Add images and audio
  const imgFolder = zip.folder("images");
  const audioFolder = zip.folder("audio");
  
  for (const c of contacts) {
    const safeName = (c.name || `Contact_${c.id}`).replace(/[^a-z0-9]/gi, '_');
    
    if (c.frontImage && imgFolder) {
      imgFolder.file(`${safeName}_front.jpg`, c.frontImage);
    }
    if (c.profileImage && imgFolder) {
      imgFolder.file(`${safeName}_profile.jpg`, c.profileImage);
    }
    
    if (c.voiceNote && audioFolder) {
      audioFolder.file(`${safeName}_note.aac`, c.voiceNote);
    }
    
    if (c.voiceNotes && audioFolder) {
      c.voiceNotes.forEach((blob, idx) => {
        audioFolder.file(`${safeName}_note_${idx + 1}.aac`, blob);
      });
    }
  }

  // 3. Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: "blob" });

  // 4. Download or Share
  if (Capacitor.isNativePlatform()) {
    const reader = new FileReader();
    reader.readAsDataURL(zipBlob);
    await new Promise(r => reader.onloadend = r);
    const base64Data = (reader.result as string).split(',')[1];
    
    const fileName = `scandex_export_${Date.now()}.zip`;
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache
    });
    
    await Share.share({
      title: 'ScanDex Export',
      text: 'ScanDex full data export archive.',
      url: result.uri,
      dialogTitle: 'Share or Save Export'
    });
  } else {
    downloadFile("scandex_export.zip", "application/zip", zipBlob);
  }
}
