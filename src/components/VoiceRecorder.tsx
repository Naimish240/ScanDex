import { useState, useEffect } from "react";
import { VoiceRecorder } from "capacitor-voice-recorder";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import { blobToDataURL } from "@/lib/db";

export function VoiceRecorderWidget({
  voiceNotes = [],
  onChange,
}: {
  voiceNotes?: Blob[];
  onChange: (blobs: Blob[]) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);

  async function startRecording() {
    try {
      const { value } = await VoiceRecorder.hasAudioRecordingPermission();
      if (!value) {
        const { value: granted } = await VoiceRecorder.requestAudioRecordingPermission();
        if (!granted) {
          alert("Microphone permission denied");
          return;
        }
      }
      await VoiceRecorder.startRecording();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      alert("Voice recorder not available on this platform");
    }
  }

  async function stopRecording() {
    try {
      const result = await VoiceRecorder.stopRecording();
      setIsRecording(false);
      if (result.value && result.value.recordDataBase64) {
        const byteCharacters = atob(result.value.recordDataBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.value.mimeType || "audio/aac" });
        onChange([...voiceNotes, blob]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {voiceNotes.map((blob, idx) => (
        <VoiceNoteItem
          key={idx}
          index={idx}
          blob={blob}
          onDelete={() => {
            const next = [...voiceNotes];
            next.splice(idx, 1);
            onChange(next);
          }}
        />
      ))}

      <div className="p-3 bg-secondary rounded-xl flex items-center justify-between border border-border">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="size-10 rounded-full bg-destructive text-destructive-foreground grid place-items-center animate-pulse"
            >
              <Square className="size-4" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="size-10 rounded-full bg-secondary ring-1 ring-border text-foreground grid place-items-center hover:bg-secondary/80"
            >
              <Mic className="size-4" />
            </button>
          )}
          <div className="text-sm font-medium">
            {isRecording ? "Recording..." : "Add Voice Note"}
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceNoteItem({
  blob,
  index,
  onDelete,
}: {
  blob: Blob;
  index: number;
  onDelete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement>();

  useEffect(() => {
    let a: HTMLAudioElement;
    blobToDataURL(blob).then((url) => {
      if (!url) return;
      a = new Audio(url);
      a.onended = () => setIsPlaying(false);
      setAudio(a);
    });
    return () => {
      if (a) {
        a.pause();
        a.src = "";
      }
    };
  }, [blob]);

  function togglePlayback() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  return (
    <div className="p-3 bg-card rounded-xl flex items-center justify-between border border-border">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayback}
          className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center"
        >
          {isPlaying ? (
            <Pause className="size-4" fill="currentColor" />
          ) : (
            <Play className="size-4 ml-1" fill="currentColor" />
          )}
        </button>
        <div className="text-sm font-medium">Voice Note {index + 1}</div>
      </div>
      <button
        onClick={() => {
          if (audio) audio.pause();
          onDelete();
        }}
        className="size-8 rounded-full grid place-items-center text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
