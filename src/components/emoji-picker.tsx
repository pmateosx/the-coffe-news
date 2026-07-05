"use client";

import { EMOJIS } from "@/lib/emojis";

export function EmojiPicker({ name = "emoji" }: { name?: string }) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {EMOJIS.map((emoji) => (
        <label key={emoji} className="cursor-pointer">
          <input type="radio" name={name} value={emoji} required className="peer sr-only" />
          <span className="flex h-10 w-10 items-center justify-center rounded border border-transparent text-2xl transition-transform peer-checked:scale-110 peer-checked:border-accent peer-checked:bg-paper-dark hover:bg-paper-dark">
            {emoji}
          </span>
        </label>
      ))}
    </div>
  );
}
