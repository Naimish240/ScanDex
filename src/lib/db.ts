import Dexie, { type Table } from "dexie";

export interface EventRow {
  id?: number;
  name: string;
  date: string; // ISO
  location?: string;
  tags: string[];
  createdAt: number;
}

export interface ContactRow {
  id?: number;
  eventId: number;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phones: string[];
  website?: string;
  linkedin?: string;
  address?: string;
  notes?: string;
  tags: string[];
  rawText: string;
  frontImage?: Blob;
  backImage?: Blob;
  profileImage?: Blob;
  voiceNote?: Blob;
  createdAt: number;
  updatedAt: number;
}

class ScanDexDB extends Dexie {
  events!: Table<EventRow, number>;
  contacts!: Table<ContactRow, number>;
  constructor() {
    super("scandex_db");
    this.version(1).stores({
      events: "++id, name, date, createdAt",
      contacts: "++id, eventId, name, company, email, createdAt",
    });
  }
}

export const db = new ScanDexDB();

export async function blobToDataURL(blob?: Blob): Promise<string | undefined> {
  console.log("[DB] blobToDataURL called");
  if (!blob) {
    console.warn("[DB] blobToDataURL called with undefined blob");
    return undefined;
  }
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      console.log("[DB] blobToDataURL read complete");
      resolve(r.result as string);
    };
    r.onerror = (e) => {
      console.error("[DB] blobToDataURL error:", e);
    };
    r.readAsDataURL(blob);
  });
}
