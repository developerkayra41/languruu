interface LevelBadgeProps {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  size?: number;
  title?: string;
  caption?: string;
  uid?: string;
}

const RADIUS = 31;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LevelBadge({
  level,
  xpIntoLevel,
  xpForNext,
  size = 112,
  title,
  caption,
  uid = "me",
}: LevelBadgeProps) {
  const ratio =
    xpForNext > 0 ? Math.max(0, Math.min(1, xpIntoLevel / xpForNext)) : 0;
  const gradientId = `levelBadgeFace-${uid}`;
  const ribbonId = `levelBadgeRibbon-${uid}`;
  const ringId = `levelBadgeRing-${uid}`;

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox="0 0 100 132"
        width={size}
        height={(size * 132) / 100}
        role="img"
        aria-label={title ?? `Level ${level}`}
      >
        {title && <title>{title}</title>}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id={ribbonId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        <path
          d="M28 56 L50 60 L40 126 L29 112 L18 122 Z"
          fill={`url(#${ribbonId})`}
          opacity="0.9"
        />
        <path
          d="M72 56 L50 60 L60 126 L71 112 L82 122 Z"
          fill={`url(#${ribbonId})`}
        />

        <circle cx="50" cy="46" r="36" fill={`url(#${gradientId})`} />
        <circle
          cx="50"
          cy="46"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="5"
        />
        {ratio > 0 && (
          <circle
            cx="50"
            cy="46"
            r={RADIUS}
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE * ratio} ${CIRCUMFERENCE}`}
            transform="rotate(-90 50 46)"
          />
        )}
        <circle cx="50" cy="46" r="26" fill="#faf5ff" />

        <text
          x="50"
          y={caption ? 44 : 47}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={level > 99 ? 22 : 28}
          fontWeight="800"
          fill="#6b21a8"
        >
          {level}
        </text>
        {caption && (
          <text
            x="50"
            y="61"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="700"
            letterSpacing="1"
            fill="#8b5cf6"
          >
            {caption}
          </text>
        )}
      </svg>
    </div>
  );
}
