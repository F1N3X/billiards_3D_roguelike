/**
 * Simulates a cue ball shot and prints the trajectory table.
 * Physics mirrors frontend/src/physics/step-physics.ts
 * Run: npx tsx scripts/simulate-trajectory.ts [angle_deg] [power_mult]
 * Example: npx tsx scripts/simulate-trajectory.ts 30 0.8
 */

// From frontend/src/config/constants.ts
const BALL_RADIUS = 0.075
const TABLE_WIDTH = 4.5
const TABLE_LENGTH = 2.5
const FRICTION = 0.978
const MIN_SPEED = 0.025
const MAX_BALL_SPEED = 8.0
const SHOT_POWER = 6.0
const POCKET_RADIUS = 0.13
const POCKET_INSET = POCKET_RADIUS * 0.55
const POCKET_XZ: [number, number][] = [
  [-(TABLE_WIDTH / 2 - POCKET_INSET), -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [ TABLE_WIDTH / 2 - POCKET_INSET,  -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [-(TABLE_WIDTH / 2 - POCKET_INSET),  TABLE_LENGTH / 2 - POCKET_INSET],
  [ TABLE_WIDTH / 2 - POCKET_INSET,   TABLE_LENGTH / 2 - POCKET_INSET],
  [0, -(TABLE_LENGTH / 2 - POCKET_INSET)],
  [0,  TABLE_LENGTH / 2 - POCKET_INSET],
]
const WALL_RESTITUTION = 0.75 // default in stepPhysics opts
const DT = 1 / 60            // physics step at 60 fps
const SAMPLE_INTERVAL = 0.25  // seconds between position snapshots

const angleDeg = parseFloat(process.argv[2] ?? '0')
const powerMult = parseFloat(process.argv[3] ?? '1.0')

if (isNaN(angleDeg) || isNaN(powerMult) || powerMult <= 0) {
  console.error('Usage: npx tsx scripts/simulate-trajectory.ts [angle_deg] [power_mult]')
  process.exit(1)
}

const angle = (angleDeg * Math.PI) / 180
const maxX = TABLE_WIDTH / 2 - BALL_RADIUS
const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS

interface Snapshot { t: number; x: number; z: number; speed: number; event: string }

let x = -TABLE_WIDTH / 4
let z = 0
let vx = Math.cos(angle) * SHOT_POWER * powerMult
let vz = Math.sin(angle) * SHOT_POWER * powerMult
let t = 0
let bounces = 0
let pocketed = false
let lastSample = -SAMPLE_INTERVAL
const snapshots: Snapshot[] = []

function snap(event = ''): void {
  snapshots.push({ t, x, z, speed: Math.hypot(vx, vz), event })
  lastSample = t
}

console.log(`Angle: ${angleDeg}°  Power: ×${powerMult}  Initial speed: ${(SHOT_POWER * powerMult).toFixed(2)}`)
console.log(`Start: (${x.toFixed(3)}, ${z.toFixed(3)})\n`)
snap('START')

let maxSteps = 200_000
while (!pocketed && Math.hypot(vx, vz) >= MIN_SPEED && maxSteps-- > 0) {
  const friction = Math.pow(FRICTION, DT * 60)
  vx *= friction
  vz *= friction
  x += vx * DT
  z += vz * DT

  let event = ''
  if (x > maxX)  { x =  maxX; vx = -Math.abs(vx) * WALL_RESTITUTION; event = 'bounce+x'; bounces++ }
  if (x < -maxX) { x = -maxX; vx =  Math.abs(vx) * WALL_RESTITUTION; event = 'bounce-x'; bounces++ }
  if (z > maxZ)  { z =  maxZ; vz = -Math.abs(vz) * WALL_RESTITUTION; event = 'bounce+z'; bounces++ }
  if (z < -maxZ) { z = -maxZ; vz =  Math.abs(vz) * WALL_RESTITUTION; event = 'bounce-z'; bounces++ }

  const spd = Math.hypot(vx, vz)
  if (spd > MAX_BALL_SPEED) { const f = MAX_BALL_SPEED / spd; vx *= f; vz *= f }

  for (const [px, pz] of POCKET_XZ) {
    if (Math.hypot(x - px, z - pz) < POCKET_RADIUS * 1.4) {
      event = `POCKET(${px.toFixed(2)},${pz.toFixed(2)})`
      pocketed = true
      snap(event)
      break
    }
  }

  if (!pocketed) {
    if (event) snap(event)
    else if (t - lastSample >= SAMPLE_INTERVAL) snap()
  }

  t += DT
}

if (!pocketed) snap('STOP')

console.log('t(s)   | x        | z        | speed   | event')
console.log('-------+----------+----------+---------+--------------------')
for (const s of snapshots) {
  console.log(
    `${s.t.toFixed(3).padStart(6)} | ${s.x.toFixed(4).padStart(8)} | ${s.z.toFixed(4).padStart(8)} | ${s.speed.toFixed(3).padStart(7)} | ${s.event}`
  )
}

console.log(`\nDuration: ${t.toFixed(2)}s  Bounces: ${bounces}`)
if (pocketed) {
  console.log('Result : SCRATCH — cue ball pocketed')
} else {
  console.log(`Result : stopped at (${x.toFixed(4)}, ${z.toFixed(4)})`)
}
