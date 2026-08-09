"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

export default function Avatar({ src, name, size = 40, className = "" }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = name.slice(0, 2).toUpperCase();
  const showImage = src && !hasError;

  return showImage ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setHasError(true)}
      style={{ width: size, height: size }}
      className={`rounded-full object-cover ${className}`}
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={`rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold ${className}`}
    >
      {initials}
    </div>
  );
}