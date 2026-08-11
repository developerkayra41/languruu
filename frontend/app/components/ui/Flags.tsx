"use client";

import { useState } from "react";
import Image from "next/image";
import { LANGUAGES } from "@/app/lib/languages";

export default function Flag({ code, className = "" }: { code: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const flagCode = LANGUAGES.find((l) => l.flagCode === code)?.flagCode;
  if (!flagCode || failed) return null;
  return (
    <Image
      src={`https://flagsapi.com/${flagCode.toUpperCase()}/flat/64.png`}
      alt=""
      width={24}
      height={18}
      onError={() => setFailed(true)}
      className={`rounded-sm object-cover ${className}`}
    />
  );
}

// "kaynak → hedef" ikilisi. languages[0]=kaynak, languages[1]=hedef.
// Grup kartlarında ve marketplace kartlarında ortak kullanılacak.
export function LanguagePair({ languages, className = "" }: { languages?: string[]; className?: string }) {
  if (!languages || languages.length === 0) return null;
  const [source, target] = languages;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
      {source && (
        <>
          <Flag code={source === 'en' ? 'gb' : source} />
          <span>{source.toUpperCase()}</span>
        </>
      )}
      {target && (
        <>
          <span className={`${className}`}>→</span>
          <Flag code={target} />
          <span>{target.toUpperCase()}</span>
        </>
      )}
    </span>
  );
}