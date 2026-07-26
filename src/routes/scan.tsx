import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { runOCR } from "@/lib/ocr";
import { extractFields } from "@/lib/extract";
import { AppShell } from "@/components/AppShell";
import { NewEventDialog } from "./events";
import { ArrowLeft, Camera as CameraIcon, Upload, Loader2, Check } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { z } from "zod";

export const Route = createFileRoute("/scan")({
  validateSearch: z.object({ eventId: z.number().optional() }),
  head: () => ({
    meta: [
      { title: "Scan Card — ScanDex" },
      { name: "description", content: "Capture a business card. Automatic OCR extracts contact fields locally." },
      { property: "og:title", content: "Scan Card — ScanDex" },
      { property: "og:description", content: "Capture and OCR business cards on-device." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const { eventId: initialEventId } = Route.useSearch();
  const events = useLiveQuery(() => db.events.orderBy("createdAt").reverse().toArray(), []);
  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState<number | undefined>(initialEventId);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [backImageBlob, setBackImageBlob] = useState<Blob | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string>("");
  const [personImageBlob, setPersonImageBlob] = useState<Blob | null>(null);
  const [personImageUrl, setPersonImageUrl] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);

  function setImage(blob: Blob) {
    console.log("[Scan] Setting image blob and creating URL", { size: blob.size, type: blob.type });
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageBlob(blob);
    setImageUrl(URL.createObjectURL(blob));
  }

  async function takePhotoNative(type: "front" | "back" | "person" = "front") {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        if (type === "front") {
          setImage(blob);
        } else if (type === "back") {
          if (backImageUrl) URL.revokeObjectURL(backImageUrl);
          setBackImageBlob(blob);
          setBackImageUrl(URL.createObjectURL(blob));
        } else if (type === "person") {
          if (personImageUrl) URL.revokeObjectURL(personImageUrl);
          setPersonImageBlob(blob);
          setPersonImageUrl(URL.createObjectURL(blob));
        }
      }
    } catch (err) {
      console.warn(`[Scan] Camera cancelled or failed for ${type}`, err);
    }
  }

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (backImageUrl) URL.revokeObjectURL(backImageUrl);
    if (personImageUrl) URL.revokeObjectURL(personImageUrl);
  }, [imageUrl, backImageUrl, personImageUrl]);

  useEffect(() => {
    if (events && events.length > 0 && !selectedEvent) setSelectedEvent(events[0].id);
  }, [events, selectedEvent]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    console.log("[Scan] File input changed");
    const f = e.target.files?.[0];
    if (f) {
      console.log(`[Scan] File selected: ${f.name} (${f.size} bytes)`);
      setImage(f);
    } else {
      console.warn("[Scan] No file selected");
    }
  }

  async function processAndSave() {
    console.log("[Scan] Starting processAndSave");
    if (!imageBlob || !selectedEvent) {
      console.warn("[Scan] Missing imageBlob or selectedEvent, aborting");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      console.log("[Scan] Calling runOCR...");
      const text = await runOCR(imageBlob, (p) => {
        console.log(`[Scan] OCR progress: ${p}`);
        setProgress(p);
      });
      console.log(`[Scan] OCR completed. Extracted text length: ${text.length}`);
      
      console.log("[Scan] Extracting fields...");
      const fields = extractFields(text);
      console.log("[Scan] Extracted fields:", fields);
      
      console.log("[Scan] Saving to database...");
      const id = await db.contacts.add({
        eventId: selectedEvent,
        name: fields.name || "Untitled",
        title: fields.title,
        company: fields.company,
        email: fields.email,
        phones: fields.phones,
        website: fields.website,
        linkedin: fields.linkedin,
        address: fields.address,
        notes: "",
        tags: [],
        rawText: text,
        frontImage: imageBlob,
        backImage: backImageBlob || undefined,
        profileImage: personImageBlob || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`[Scan] Saved to database with ID: ${id}`);
      navigate({ to: "/contacts/$contactId", params: { contactId: String(id) } });
    } catch (err) {
      console.error("[Scan] OCR or save failed:", err);
      alert("OCR failed. You can still save and edit fields manually.");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground mb-3">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tighter">Capture</h1>
      </header>

      {/* Event picker */}
      <section className="px-5 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Assign to scope
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
          <button
            onClick={() => setShowNewEvent(true)}
            className="flex-none px-3 py-2 rounded-full bg-secondary text-xs font-bold border-2 border-dashed border-border"
          >
            + New
          </button>
          {(events ?? []).map((ev) => {
            const active = ev.id === selectedEvent;
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEvent(ev.id)}
                className={`flex-none px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                {ev.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Scanner viewport */}
      <section className="mx-5 rounded-3xl bg-zinc-900 relative aspect-[3/4] overflow-hidden shadow-2xl">
        {imageUrl ? (
          <img src={imageUrl} alt="Captured card" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <button onClick={() => takePhotoNative("front")} className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600 hover:text-zinc-400 transition-colors">
            <CameraIcon className="size-16" />
          </button>
        )}

        {/* Viewfinder frame */}
        {!imageUrl && (
          <>
            <div className="absolute inset-6 pointer-events-none">
              <div className="absolute top-0 left-0 size-6 border-t-2 border-l-2 border-white/60" />
              <div className="absolute top-0 right-0 size-6 border-t-2 border-r-2 border-white/60" />
              <div className="absolute bottom-0 left-0 size-6 border-b-2 border-l-2 border-white/60" />
              <div className="absolute bottom-0 right-0 size-6 border-b-2 border-r-2 border-white/60" />
            </div>
          </>
        )}

        {busy && (
          <div className="absolute inset-0 bg-black/70 grid place-items-center text-white">
            <div className="text-center">
              <Loader2 className="size-8 animate-spin mx-auto mb-3" />
              <p className="font-mono text-xs uppercase tracking-widest">Reading card</p>
              <p className="font-mono text-2xl font-bold mt-1">{Math.round(progress * 100)}%</p>
            </div>
          </div>
        )}
      </section>

      {/* Controls */}
      <section className="px-5 mt-4 space-y-3">
        {!imageUrl ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => takePhotoNative("front")} className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer">
              <CameraIcon className="size-4" /> Take Photo
            </button>
            <label className="h-12 rounded-2xl bg-secondary font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="size-4" /> Upload
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Back Card Preview or Button */}
              {backImageUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                  <img src={backImageUrl} className="w-full h-full object-cover opacity-80" />
                  <button onClick={() => { setBackImageBlob(null); setBackImageUrl(""); }} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black">
                    <span className="text-[10px] leading-none px-1">✕</span>
                  </button>
                  <span className="absolute bottom-1 left-2 text-[10px] text-white font-bold drop-shadow-md">Back</span>
                </div>
              ) : (
                <button onClick={() => takePhotoNative("back")} className="h-16 rounded-xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground flex flex-col items-center justify-center gap-1 hover:bg-secondary/50 transition-colors">
                  <CameraIcon className="size-4" /> Add Back
                </button>
              )}
              
              {/* Person Preview or Button */}
              {personImageUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                  <img src={personImageUrl} className="w-full h-full object-cover opacity-80" />
                  <button onClick={() => { setPersonImageBlob(null); setPersonImageUrl(""); }} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black">
                    <span className="text-[10px] leading-none px-1">✕</span>
                  </button>
                  <span className="absolute bottom-1 left-2 text-[10px] text-white font-bold drop-shadow-md">Person</span>
                </div>
              ) : (
                <button onClick={() => takePhotoNative("person")} className="h-16 rounded-xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground flex flex-col items-center justify-center gap-1 hover:bg-secondary/50 transition-colors">
                  <CameraIcon className="size-4" /> Add Person
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setImageBlob(null); setImageUrl(""); setBackImageBlob(null); setBackImageUrl(""); setPersonImageBlob(null); setPersonImageUrl(""); }}
                disabled={busy}
                className="h-12 rounded-2xl bg-secondary font-bold text-sm hover:bg-secondary/80 transition-colors"
              >
                Retake Front
              </button>
              <button
                onClick={processAndSave}
                disabled={busy || !selectedEvent}
                className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Extract & Save
              </button>
            </div>
          </div>
        )}
        {!selectedEvent && (
          <p className="text-[11px] text-center text-destructive font-mono">Create or select an event first</p>
        )}
      </section>

      {showNewEvent && (
        <NewEventDialog
          onClose={() => setShowNewEvent(false)}
          onCreated={(id) => setSelectedEvent(id)}
        />
      )}
    </AppShell>
  );
}
