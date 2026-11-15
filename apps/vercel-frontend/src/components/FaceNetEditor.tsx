import {
  COLOR_KEYS, COLORS, FACE_NAMES, getFacelet, setFacelet,
  type ColorKey, type CubeState, type FaceKey,
} from '../cube/model'

// Unfolded cube layout: U on top, L F R B across the middle, D at the bottom.
const NET: { face: FaceKey; col: number; row: number }[] = [
  { face: 'U', col: 2, row: 1 },
  { face: 'L', col: 1, row: 2 },
  { face: 'F', col: 2, row: 2 },
  { face: 'R', col: 3, row: 2 },
  { face: 'B', col: 4, row: 2 },
  { face: 'D', col: 2, row: 3 },
]

interface Props {
  state: CubeState
  onChange: (next: CubeState) => void
  brush: ColorKey
  onBrushChange: (c: ColorKey) => void
}

export function ColorPalette({ brush, onBrushChange }: Pick<Props, 'brush' | 'onBrushChange'>) {
  return (
    <div className="palette" role="radiogroup" aria-label="Paint color">
      {COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={brush === c}
          aria-label={COLORS[c].name}
          title={COLORS[c].name}
          className={`swatch ${brush === c ? 'is-active' : ''}`}
          style={{ '--swatch': COLORS[c].hex } as React.CSSProperties}
          onClick={() => onBrushChange(c)}
        />
      ))}
    </div>
  )
}

export default function FaceNetEditor({ state, onChange, brush }: Props) {
  return (
    <div className="net" aria-label="Cube faces">
      {NET.map(({ face, col, row }) => (
        <div
          key={face}
          className="net-face"
          style={{ gridColumn: col, gridRow: row }}
          aria-label={`${FACE_NAMES[face]} face`}
        >
          <span className="net-label">{face}</span>
          {[0, 1, 2].flatMap((r) =>
            [0, 1, 2].map((c) => {
              const color = getFacelet(state, face, r, c)
              const center = r === 1 && c === 1
              return (
                <button
                  key={`${r}${c}`}
                  type="button"
                  className={`facelet ${center ? 'is-center' : ''}`}
                  style={{ background: COLORS[color].hex }}
                  disabled={center}
                  title={center ? `${FACE_NAMES[face]} center (fixed)` : `Paint ${COLORS[brush].name}`}
                  aria-label={`${FACE_NAMES[face]} row ${r + 1} column ${c + 1}: ${COLORS[color].name}`}
                  onClick={() => onChange(setFacelet(state, face, r, c, brush))}
                />
              )
            }),
          )}
        </div>
      ))}
    </div>
  )
}
