import { ZALO_URL } from "@/lib/constants";
import { ZaloIcon } from "./brand-icons";

export function FloatingZalo() {
  return (
    <a
      aria-label="Chat with random.phitruong on Zalo"
      className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-black px-4 text-xs font-black uppercase tracking-[0.08em] text-white shadow-2xl hover:-translate-y-1 hover:bg-zinc-800"
      href={ZALO_URL}
      rel="noreferrer"
      target="_blank"
    >
      <ZaloIcon size={20} />
      <span>Zalo</span>
    </a>
  );
}
