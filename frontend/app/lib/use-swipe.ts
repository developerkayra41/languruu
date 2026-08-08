import { useRef } from "react";

/**
 * Dokunmatik yatay kaydırma (swipe) algılar. Sola kaydırınca `onLeft`,
 * sağa kaydırınca `onRight` çağrılır. Dikey scroll ile karışmaması için
 * sadece yatay hareket dikeyden baskınsa tetiklenir.
 */
export function useSwipe(
  onLeft: () => void,
  onRight: () => void,
  threshold = 50,
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onLeft();
        else onRight();
      }
      startX.current = null;
      startY.current = null;
    },
  };
}
