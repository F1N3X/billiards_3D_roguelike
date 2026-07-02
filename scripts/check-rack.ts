/**
 * Validates the triangle rack geometry (initial ball placement).
 * Logic mirrors frontend/src/scene/create-balls.ts
 * Run: npx tsx scripts/check-rack.ts
 * Exit: 0 = valid, 1 = geometry errors found
 */

// From frontend/src/config/constants.ts
const BALL_RADIUS = 0.075
const TABLE_WIDTH = 4.5
const TABLE_LENGTH = 2.5
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

// Logic from frontend/src/scene/create-balls.ts
const startX = TABLE_WIDTH / 4
const spacing = BALL_RADIUS * 2.05

interface BallPos { label: string; x: number; z: number }

const rack: BallPos[] = []
for (let row = 0; row < 5; row++) {
  for (let col = 0; col <= row; col++) {
    rack.push({
      label: `ball_${rack.length + 1}`,
      x: startX + row * spacing * Math.cos(Math.PI / 6),
      z: (col - row / 2) * spacing,
    })
  }
}

const cueBall: BallPos = { label: 'cue', x: -TABLE_WIDTH / 4, z: 0 }
const allBalls: BallPos[] = [cueBall, ...rack]

let errors = 0
function fail(msg: string): void { console.error(`  ✗  ${msg}`); errors++ }
function pass(msg: string): void { console.log(`  ✓  ${msg}`) }

// Ball count
console.log(`Rack: ${rack.length} numbered balls + 1 cue  (expected 15 + 1)\n`)
if (rack.length !== 15) fail(`expected 15 rack balls, got ${rack.length}`)

// Bounds
console.log('--- Bounds ---')
const maxX = TABLE_WIDTH / 2 - BALL_RADIUS
const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS
let boundsOk = true
for (const b of allBalls) {
  if (Math.abs(b.x) > maxX || Math.abs(b.z) > maxZ) {
    fail(`${b.label} at (${b.x.toFixed(4)}, ${b.z.toFixed(4)}) out of ±(${maxX.toFixed(4)}, ${maxZ.toFixed(4)})`)
    boundsOk = false
  }
}
if (boundsOk) pass('all within table bounds')

// Overlaps
console.log('\n--- Overlaps ---')
const diam = BALL_RADIUS * 2
let overlapOk = true
for (let i = 0; i < allBalls.length; i++) {
  for (let j = i + 1; j < allBalls.length; j++) {
    const a = allBalls[i], b = allBalls[j]
    const d = Math.hypot(a.x - b.x, a.z - b.z)
    if (d < diam - 1e-4) {
      fail(`${a.label} ↔ ${b.label}: dist=${d.toFixed(5)} < diam=${diam}`)
      overlapOk = false
    }
  }
}
if (overlapOk) pass('no overlaps')

// Pocket proximity
console.log('\n--- Pocket proximity ---')
let pocketOk = true
for (const b of allBalls) {
  for (const [px, pz] of POCKET_XZ) {
    if (Math.hypot(b.x - px, b.z - pz) < POCKET_RADIUS * 1.4) {
      fail(`${b.label} too close to pocket (${px.toFixed(2)}, ${pz.toFixed(2)})`)
      pocketOk = false
    }
  }
}
if (pocketOk) pass('no balls start in pockets')

// Spacing consistency in rack
console.log('\n--- Rack spacing ---')
const EXPECTED_MIN_DIST = BALL_RADIUS * 2
const EXPECTED_MAX_DIST = spacing * 1.1
let spacingOk = true
for (let i = 1; i < rack.length; i++) {
  for (let j = i + 1; j < rack.length; j++) {
    const d = Math.hypot(rack[i].x - rack[j].x, rack[i].z - rack[j].z)
    if (d < EXPECTED_MIN_DIST - 1e-4) {
      fail(`rack balls ${i + 1} and ${j + 1} overlap (dist=${d.toFixed(4)})`)
      spacingOk = false
    }
  }
}
if (spacingOk) pass(`rack spacing OK (min dist >= ${EXPECTED_MIN_DIST.toFixed(4)})`)

// Positions listing
console.log('\n--- Positions (x, z) ---')
for (const b of allBalls) {
  console.log(`  ${b.label.padEnd(8)} : (${b.x.toFixed(4)}, ${b.z.toFixed(4)})`)
}

console.log(`\n${errors === 0 ? '✓ rack is valid' : `✗ ${errors} error(s) found`}`)
process.exit(errors === 0 ? 0 : 1)
