import { useEffect, useState } from "react";
import type { ContactRow } from "@/lib/db";
import { blobToDataURL } from "@/lib/db";

export function ContactThumb({ contact }: { contact: ContactRow }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let alive = true;
    blobToDataURL(contact.profileImage || contact.frontImage).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [contact.id]);
  return (
    <div className="aspect-[1.6/1] rounded-lg bg-secondary overflow-hidden grid place-items-center">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[9px] font-mono text-muted-foreground uppercase">No image</span>
      )}
    </div>
  );
}
