import { OrbitControls, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame, useThree, type RootState, type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { moveFromDrag, type Project } from './drag'
import { COLORS, isInLayer, type CubeState, type Cubie, type Move, type Vec3 } from './model'

export interface ActiveMove {
  move: Move
  id: number // changes for every new animation
}

interface CubeViewProps {
  state: CubeState
  active?: ActiveMove | null
  /** Seconds per quarter turn. */
  turnDuration?: number
  onMoveDone?: () => void
  onStickerClick?: (pos: Vec3, normal: Vec3) => void
  /** Enables drag-to-turn: drag a sticker to turn its layer (mouse or touch). */
  onTurn?: (move: Move) => void
  autoRotate?: boolean
  /** Render at low resolution and upscale with hard pixels. */
  pixelated?: boolean
  className?: string
  children?: ReactNode
}

const AXES = ['x', 'y', 'z'] as const

function stickerRotation(n: Vec3): [number, number, number] {
  if (n[0] === 1) return [0, Math.PI / 2, 0]
  if (n[0] === -1) return [0, -Math.PI / 2, 0]
  if (n[1] === 1) return [-Math.PI / 2, 0, 0]
  if (n[1] === -1) return [Math.PI / 2, 0, 0]
  if (n[2] === -1) return [0, Math.PI, 0]
  return [0, 0, 0]
}

function useStickerGeometry() {
  return useMemo(() => {
    const s = 0.42
    const r = 0.1
    const shape = new THREE.Shape()
    shape.moveTo(-s + r, -s)
    shape.lineTo(s - r, -s)
    shape.quadraticCurveTo(s, -s, s, -s + r)
    shape.lineTo(s, s - r)
    shape.quadraticCurveTo(s, s, s - r, s)
    shape.lineTo(-s + r, s)
    shape.quadraticCurveTo(-s, s, -s, s - r)
    shape.lineTo(-s, -s + r)
    shape.quadraticCurveTo(-s, -s, -s + r, -s)
    return new THREE.ShapeGeometry(shape)
  }, [])
}

type StickerDown = (pos: Vec3, normal: Vec3, e: ThreeEvent<PointerEvent>) => void

function CubieMesh({
  cubie, geometry, onStickerClick, onStickerDown,
}: {
  cubie: Cubie
  geometry: THREE.ShapeGeometry
  onStickerClick?: (pos: Vec3, normal: Vec3) => void
  onStickerDown?: StickerDown
}) {
  return (
    <group position={cubie.pos}>
      <RoundedBox args={[0.98, 0.98, 0.98]} radius={0.08} smoothness={3}>
        <meshStandardMaterial color="#14151a" roughness={0.6} />
      </RoundedBox>
      {cubie.stickers.map((s) => (
        <mesh
          key={s.normal.join()}
          geometry={geometry}
          position={[s.normal[0] * 0.495, s.normal[1] * 0.495, s.normal[2] * 0.495]}
          rotation={stickerRotation(s.normal)}
          onClick={
            onStickerClick
              ? (e: ThreeEvent<MouseEvent>) => {
                  if (e.delta > 4) return // was an orbit drag, not a click
                  e.stopPropagation()
                  onStickerClick(cubie.pos, s.normal)
                }
              : undefined
          }
          onPointerDown={onStickerDown ? (e) => onStickerDown(cubie.pos, s.normal, e) : undefined}
        >
          <meshStandardMaterial color={COLORS[s.color].hex} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/** Pixels the pointer must travel before a drag counts as a turn. */
const DRAG_THRESHOLD = 12

/** Turn the camera's orbit controls (drei's makeDefault controls) on or off. */
function setOrbit(get: () => RootState, enabled: boolean) {
  const controls = get().controls as unknown as { enabled: boolean } | null
  if (controls) controls.enabled = enabled
}

function CubeModel({
  state, active, turnDuration = 0.35, onMoveDone, onStickerClick, onTurn, autoRotate,
}: CubeViewProps) {
  const geometry = useStickerGeometry()
  const get = useThree((s) => s.get)

  // Drag-to-turn. R3F handles this pointerdown before OrbitControls sees it,
  // so switching the controls off here stops the camera from orbiting during
  // the drag. Dragging the background still orbits as usual.
  const onStickerDown: StickerDown | undefined = onTurn && ((pos, normal, e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setOrbit(get, false)
    const camera = e.camera
    const rect = (e.nativeEvent.target as Element).getBoundingClientRect()
    const project: Project = (p) => {
      const v = new THREE.Vector3(p[0], p[1], p[2]).project(camera)
      return [((v.x + 1) / 2) * rect.width, ((1 - v.y) / 2) * rect.height]
    }
    const point: Vec3 = [e.point.x, e.point.y, e.point.z]
    const x0 = e.nativeEvent.clientX
    const y0 = e.nativeEvent.clientY
    let turned = false
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - x0
      const dy = ev.clientY - y0
      if (turned || Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      turned = true // one turn per drag
      onTurn(moveFromDrag(pos, normal, point, [dx, dy], project))
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      setOrbit(get, true)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  })
  const pivot = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const progress = useRef(0)
  const finished = useRef(false)

  useLayoutEffect(() => {
    progress.current = 0
    finished.current = false
    pivot.current?.rotation.set(0, 0, 0)
  }, [active?.id])

  useFrame((_, dt) => {
    if (autoRotate && root.current) root.current.rotation.y += dt * 0.3
    if (!active || !pivot.current || finished.current) return
    const { move } = active
    const turns = Math.abs(move.quarterTurns)
    const duration = turnDuration * (turns === 2 ? 1.5 : 1)
    progress.current = Math.min(1, progress.current + dt / duration)
    const angle = (move.quarterTurns * Math.PI) / 2 * easeInOut(progress.current)
    pivot.current.rotation.set(0, 0, 0)
    pivot.current.rotation[AXES[move.axis]] = angle
    if (progress.current >= 1) {
      finished.current = true
      onMoveDone?.()
    }
  })

  const moving = active ? state.filter((c) => isInLayer(c.pos, active.move)) : []
  const still = active ? state.filter((c) => !isInLayer(c.pos, active.move)) : state

  return (
    <group ref={root}>
      <group ref={pivot}>
        {moving.map((c) => (
          <CubieMesh key={c.id} cubie={c} geometry={geometry} onStickerClick={onStickerClick} onStickerDown={onStickerDown} />
        ))}
      </group>
      {still.map((c) => (
        <CubieMesh key={c.id} cubie={c} geometry={geometry} onStickerClick={onStickerClick} onStickerDown={onStickerDown} />
      ))}
    </group>
  )
}

export default function CubeView({ children, ...props }: CubeViewProps) {
  const px = !!props.pixelated
  return (
    <div className={`cube-view ${px ? 'is-pixel' : ''} ${props.className ?? ''}`}>
      <Canvas
        key={px ? 'px' : 'hd'} // antialias can only be set when the GL context is created
        camera={{ position: [5, 4.3, 6.4], fov: 38 }}
        dpr={px ? 0.36 : [1, 2]}
        gl={{ antialias: !px }}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[5, 8, 6]} intensity={1.6} />
        <directionalLight position={[-6, -3, -4]} intensity={0.5} />
        <CubeModel {...props} />
        <OrbitControls makeDefault enablePan={false} minDistance={6} maxDistance={14} />
      </Canvas>
      {children}
    </div>
  )
}
