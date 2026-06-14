interface FlowboardLogoProps {
  iconSize?: number
  showWordmark?: boolean
  wordmarkClassName?: string
}

export default function FlowboardLogo({
  iconSize = 40,
  showWordmark = true,
  wordmarkClassName = "text-lg",
}: FlowboardLogoProps) {
  return (
    <span className="inline-flex items-center gap-3" aria-label="Flowboard">
      <span
        className="grid place-items-center rounded-[28%] border border-[#9CDCFE]/20 bg-[#07131a] shadow-[inset_0_0_0_1px_rgba(156,220,254,0.08),0_0_24px_rgba(78,201,176,0.12)]"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 96 96"
          className="h-[72%] w-[72%] overflow-visible"
          fill="none"
        >
          <g stroke="#9CDCFE" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M23 48L36 25H60L73 48L60 71H36L23 48Z"
              strokeWidth="3"
              opacity="0.86"
            />
            <path d="M36 25L48 48L60 25" strokeWidth="2.2" opacity="0.56" />
            <path d="M36 71L48 48L60 71" strokeWidth="2.2" opacity="0.56" />
            <path d="M23 48H73" strokeWidth="2.2" opacity="0.56" />
            <path d="M48 48H48.5" strokeWidth="18" opacity="0.14" />
          </g>
          {[
            [36, 25],
            [60, 25],
            [73, 48],
            [60, 71],
            [36, 71],
            [23, 48],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle
                cx={cx}
                cy={cy}
                r="10"
                fill="#07131a"
                stroke="#9CDCFE"
                strokeWidth="4"
              />
              <circle cx={cx} cy={cy} r="4.2" fill="#4EC9B0" />
            </g>
          ))}
          <circle
            cx="48"
            cy="48"
            r="15"
            fill="#0b1720"
            stroke="#9CDCFE"
            strokeWidth="4"
          />
          <rect
            x="41"
            y="41"
            width="14"
            height="14"
            rx="3"
            fill="#C586C0"
            className="drop-shadow-[0_0_12px_rgba(197,134,192,0.72)]"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={`font-sans font-semibold tracking-normal text-white ${wordmarkClassName}`}
        >
          Flow<span className="font-normal text-[#4EC9B0]">board</span>
        </span>
      ) : null}
    </span>
  )
}
