import { useEffect, useId, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type Props = {
  progress: number;
  isDay: boolean;
  bright: boolean;
  /** live progress source, called on each animation frame */
  sample?: () => number;
  className?: string;
  height?: number;
};

const W = 300;

export function HorizonArc({ progress, isDay, bright, sample, className, height = 96 }: Props) {
  const reduced = usePrefersReducedMotion();
  const dotRef = useRef<SVGGElement | null>(null);
  const glowRef = useRef<SVGRadialGradientElement | null>(null);
  const uid = useId().replace(/[:]/g, "");

  const cx = W / 2;
  const r = W / 2 - 10;
  const baseY = height - 6;

  const pointAt = (t: number) => {
    const theta = Math.PI * (1 - Math.min(1, Math.max(0, t)));
    return {
      x: Math.round((cx + r * Math.cos(theta)) * 10) / 10,
      y: Math.round((baseY - r * 0.52 * Math.sin(theta)) * 10) / 10,
    };
  };

  useEffect(() => {
    if (reduced || !sample) return;
    let raf = 0;
    const loop = () => {
      const p = pointAt(sample());
      dotRef.current?.setAttribute("transform", `translate(${p.x} ${p.y})`);
      glowRef.current?.setAttribute("cx", String(p.x));
      glowRef.current?.setAttribute("cy", String(p.y));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, sample, height]);

  const p = pointAt(progress);
  const dotColor = isDay ? "#FFF3D6" : "#C8CEE8";
  const lineColor = bright ? "rgba(28,30,44,0.55)" : "rgba(242,240,236,0.5)";
  const gid = `arc-glow-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={gid}
          ref={glowRef}
          gradientUnits="userSpaceOnUse"
          cx={p.x}
          cy={p.y}
          r={W * 0.42}
        >
          <stop offset="0%" stopColor={lineColor} stopOpacity="1" />
          <stop offset="45%" stopColor={lineColor} stopOpacity="0.45" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <path
        d={`M ${cx - r} ${baseY} A ${r} ${r * 0.52} 0 0 1 ${cx + r} ${baseY}`}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={1.25}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <g ref={dotRef} transform={`translate(${p.x} ${p.y})`}>
        <circle r={height > 140 ? 16 : 9} fill={dotColor} opacity={isDay ? 0.22 : 0.12} />
        <circle r={height > 140 ? 6 : 3.4} fill={dotColor} opacity={isDay ? 1 : 0.75} />
      </g>
    </svg>
  );
}
