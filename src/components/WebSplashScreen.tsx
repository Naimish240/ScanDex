import { useEffect, useState } from "react";
import { IdCard } from "lucide-react";

export function WebSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeTagline, setFadeTagline] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fade in tagline
    const t1 = setTimeout(() => setFadeTagline(true), 400);
    // Fade out tagline
    const t2 = setTimeout(() => setFadeTagline(false), 1800);
    // Fade out entire splash screen
    const t3 = setTimeout(() => setFadeOut(true), 2200);
    // Trigger complete
    const t4 = setTimeout(onComplete, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center animate-fade-in-up">
        <IdCard className="w-24 h-24 text-black mb-6" strokeWidth={1.5} />
        <div
          className={`text-zinc-500 font-mono tracking-widest text-xs uppercase transition-opacity duration-500 flex flex-col items-center gap-2 ${
            fadeTagline ? "opacity-100" : "opacity-0"
          }`}
        >
          <span>Your offline rolodex</span>
          <span className="text-[9px] text-zinc-400 normal-case tracking-normal">Made with ❤️ by Naimish240</span>
        </div>
      </div>
    </div>
  );
}
