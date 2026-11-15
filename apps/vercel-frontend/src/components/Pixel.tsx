import { COLORS, type ColorKey } from '../cube/model'

interface PixelArtProps {
  rows: string[]
  /** Color per character; defaults to the current text color for "X". */
  palette?: Record<string, string>
  /** Size of one pixel in CSS px. */
  scale?: number
  className?: string
  label?: string
}

/** Renders a pixel-art icon as crisp SVG squares. */
export function PixelArt({ rows, palette = {}, scale = 4, className, label }: PixelArtProps) {
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  return (
    <svg
      className={`pixel-art ${className ?? ''}`}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === '.' ? null : (
            <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={palette[ch] ?? 'currentColor'} />
          ),
        ),
      )}
    </svg>
  )
}

/** A single 3x3 cube face drawn as chunky pixels. */
export function PixelFace({ pattern, size = 64, className }: { pattern: string; size?: number; className?: string }) {
  // 3 stickers of 4px + 1px gaps + 1px border = 16 units
  return (
    <svg className={`pixel-face ${className ?? ''}`} width={size} height={size} viewBox="0 0 16 16"
      shapeRendering="crispEdges" aria-hidden>
      <rect width={16} height={16} fill="#171612" />
      {[...pattern].slice(0, 9).map((c, i) => (
        <rect key={i} x={1 + (i % 3) * 5} y={1 + Math.floor(i / 3) * 5} width={4} height={4}
          fill={COLORS[c as ColorKey]?.hex ?? '#888'} />
      ))}
      {/* tiny highlight pixel on each sticker */}
      {[...pattern].slice(0, 9).map((_, i) => (
        <rect key={`h${i}`} x={1 + (i % 3) * 5} y={1 + Math.floor(i / 3) * 5} width={1} height={1}
          fill="rgba(255,255,255,0.55)" />
      ))}
    </svg>
  )
}
