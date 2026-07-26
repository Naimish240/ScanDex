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
  
  // 1. Add global CSV
  const csvContent = contactsToCSV(contacts, events);
  zip.file("contacts.csv", csvContent);

  const evMap = new Map(events.map((e) => [e.id!, e]));

  // 2. Add contact folders
  for (const c of contacts) {
    const event = evMap.get(c.eventId);
    const evName = event ? `${event.name}_${event.date.split('T')[0]}` : "UnknownEvent";
    const evFolder = zip.folder(evName.replace(/[^a-z0-9]/gi, '_'));
    if (!evFolder) continue;

    const compName = c.company || 'NoCompany';
    const personName = c.name || `Contact_${c.id}`;
    const contactFolderName = `${compName}_${personName}`.replace(/[^a-z0-9]/gi, '_');
    
    const contactFolder = evFolder.folder(contactFolderName);
    if (!contactFolder) continue;

    const voiceFolder = contactFolder.folder("voice_notes");
    const photoFolder = contactFolder.folder("photos");

    // Create details.txt
    const details = [
      `Name: ${c.name || "N/A"}`,
      `Title: ${c.title || "N/A"}`,
      `Company: ${c.company || "N/A"}`,
      `Email: ${c.email || "N/A"}`,
      `Phones: ${c.phones.join(", ") || "N/A"}`,
      `Website: ${c.website || "N/A"}`,
      `LinkedIn: ${c.linkedin || "N/A"}`,
      `Address: ${c.address || "N/A"}`,
      `Tags: ${c.tags.join(", ") || "N/A"}`,
      `Notes:\n${c.notes || "None"}`,
    ].join("\n");
    contactFolder.file("details.txt", details);

    // Helper to safely add blob as array buffer
    const addFile = async (folder: JSZip | null, filename: string, blob?: Blob) => {
      if (blob && folder) {
        try {
          const buffer = await blob.arrayBuffer();
          folder.file(filename, buffer);
        } catch (e) {
          console.warn(`[Export] Failed to add ${filename}`, e);
        }
      }
    };

    if (photoFolder) {
      await addFile(photoFolder, "front.jpg", c.frontImage);
      await addFile(photoFolder, "back.jpg", c.backImage);
      await addFile(photoFolder, "person.jpg", c.profileImage);
    }

    if (voiceFolder) {
      if (c.voiceNotes && c.voiceNotes.length > 0) {
        for (let i = 0; i < c.voiceNotes.length; i++) {
          await addFile(voiceFolder, `note_${i + 1}.aac`, c.voiceNotes[i]);
        }
      } else if (c.voiceNote) {
        await addFile(voiceFolder, "note.aac", c.voiceNote);
      }
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
