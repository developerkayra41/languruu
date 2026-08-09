"use client";

import { useEffect, useState } from "react";

const PAIRS = [
  { term: "run", translation: "koşmak", ipa: "/rʌn/" },
  { term: "hope", translation: "umut", ipa: "/hoʊp/" },
  { term: "bridge", translation: "köprü", ipa: "/brɪdʒ/" },
  { term: "wander", translation: "gezinmek", ipa: "/ˈwɒn.dər/" },
];

interface AuthHeroProps {
  headline: string;
  subtext: string;
}

export default function AuthHero({ headline, subtext }: AuthHeroProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const flipTimer = setInterval(() => setFlipped((f) => !f), 1800);
    return () => clearInterval(flipTimer);
  }, []);

  useEffect(() => {
    if (!flipped) {
      const next = setTimeout(() => setIndex((i) => (i + 1) % PAIRS.length), 50);
      return () => clearTimeout(next);
    }
  }, [flipped]);

  const current = PAIRS[index];

  return (
    <div className="relative hidden md:flex flex-col justify-between w-1/2 min-h-screen p-12 overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-blue-500">
      {}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex items-center text-white">
        <i className="fas fa-graduation-cap mr-2 text-2xl"></i>
        <span className="text-2xl font-bold">Languruu</span>
      </div>

      <div className="relative z-10 flex flex-col items-start">
        <span className="font-mono text-sm text-purple-200 mb-3 tracking-wide">
          {current.ipa}
        </span>

        <div className="[perspective:1000px] w-full max-w-xs mb-4">
          <div
            className="relative h-40 transition-transform duration-500 [transform-style:preserve-3d]"
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-2xl shadow-xl [backface-visibility:hidden]">
              <span className="text-4xl font-bold text-gray-800">{current.term}</span>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-2xl shadow-xl [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
            >
              <span className="text-4xl font-bold text-purple-700">{current.translation}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-white max-w-sm">
        <h2 className="text-2xl font-bold mb-2">{headline}</h2>
        <p className="text-purple-100 text-sm leading-relaxed">{subtext}</p>
      </div>
    </div>
  );
}