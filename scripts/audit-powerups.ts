/**
 * Audits power-up definitions for completeness and cross-consistency.
 * Reads: frontend/src/game/powerups/ + frontend/src/config/power-ups.ts
 * Run: npx tsx scripts/audit-powerups.ts
 * Exit: 0 = all OK, 1 = issues found
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const POWERUPS_DIR = resolve(ROOT, 'frontend/src/game/powerups')

const EXCLUDED = new Set(['types.ts', 'registry.ts', 'index.ts'])
const MAX_EXPECTED_COST = 6

interface PowerUpDef {
  file: string
  id: string | null
  name: string | null
  description: string | null
  cost: number | null
}

let errors = 0
function fail(msg: string): void { console.error(`  ✗  ${msg}`); errors++ }
function pass(msg: string): void { console.log(`  ✓  ${msg}`) }

// Find all power-up implementation files
const files = readdirSync(POWERUPS_DIR)
  .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts') && !EXCLUDED.has(f))
  .sort()

const defs: PowerUpDef[] = []

for (const file of files) {
  const src = readFileSync(resolve(POWERUPS_DIR, file), 'utf-8')
  const id = src.match(/id:\s*['"]([^'"]+)['"]/)?.[1] ?? null
  const name = src.match(/name:\s*['"]([^'"]+)['"]/)?.[1] ?? null
  const desc = src.match(/description:\s*['"]([^'"]+)['"]/)?.[1] ?? null
  const costStr = src.match(/cost:\s*(\d+)/)?.[1] ?? null
  defs.push({ file, id, name, description: desc, cost: costStr !== null ? parseInt(costStr, 10) : null })
}

// Validate each definition
console.log(`=== Definitions (${defs.length} files) ===\n`)
for (const d of defs) {
  const issues: string[] = []
  if (!d.id) issues.push('missing id')
  if (!d.name) issues.push('missing name')
  if (!d.description) issues.push('missing description')
  else if (d.description.length < 10) issues.push(`description too short: "${d.description}"`)
  if (d.cost === null) issues.push('missing cost')
  else if (d.cost <= 0 || !Number.isInteger(d.cost)) issues.push(`cost must be a positive integer, got ${d.cost}`)
  else if (d.cost > MAX_EXPECTED_COST) issues.push(`cost=${d.cost} exceeds max expected (${MAX_EXPECTED_COST})`)

  if (issues.length > 0) {
    console.log(`  [${d.file}]`)
    issues.forEach(i => fail(i))
  } else {
    pass(`${d.file.replace('.ts', '').padEnd(20)} id="${d.id}"  name="${d.name}"  cost=${d.cost}`)
  }
}

// Duplicate IDs
const idCounts = new Map<string, number>()
for (const d of defs) {
  if (d.id) idCounts.set(d.id, (idCounts.get(d.id) ?? 0) + 1)
}
const dups = [...idCounts.entries()].filter(([, n]) => n > 1)
if (dups.length > 0) {
  console.log('\n--- Duplicate IDs ---')
  dups.forEach(([id, n]) => fail(`"${id}" defined ${n} times`))
}

// Cross-check with registry
const registrySrc = readFileSync(resolve(POWERUPS_DIR, 'registry.ts'), 'utf-8')
const registeredIds = [...registrySrc.matchAll(/\['([^']+)',/g)].map(m => m[1])
const defIds = new Set(defs.map(d => d.id).filter(Boolean) as string[])
const regSet = new Set(registeredIds)

console.log(`\n=== Registry cross-check (${registeredIds.length} registered) ===\n`)
for (const id of defIds) {
  if (!regSet.has(id)) fail(`"${id}" is defined but missing from registry`)
}
for (const id of registeredIds) {
  if (!defIds.has(id)) fail(`"${id}" is in registry but has no definition file`)
}
if (errors === 0) pass(`all ${defIds.size} definitions are registered`)

// Cross-check with PowerUpId type
const typesSrc = readFileSync(resolve(POWERUPS_DIR, 'types.ts'), 'utf-8')
const typeIdLine = typesSrc.match(/type PowerUpId = ([^;]+)/s)?.[1] ?? ''
const typeIds = new Set([...typeIdLine.matchAll(/'([^']+)'/g)].map(m => m[1]))

console.log(`\n=== PowerUpId type cross-check (${typeIds.size} type entries) ===\n`)
for (const id of regSet) {
  if (!typeIds.has(id)) fail(`"${id}" is registered but not in PowerUpId type`)
}
for (const id of typeIds) {
  if (!regSet.has(id)) fail(`"${id}" is in PowerUpId type but not in registry`)
}
if (errors === 0) pass(`all ${regSet.size} registered IDs match the PowerUpId type`)

// Cost distribution
console.log('\n=== Cost distribution ===\n')
const costMap = new Map<number, string[]>()
for (const d of defs) {
  if (d.cost !== null) {
    if (!costMap.has(d.cost)) costMap.set(d.cost, [])
    costMap.get(d.cost)!.push(d.id ?? d.file)
  }
}
for (const [cost, ids] of [...costMap.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  cost ${cost}: ${ids.join(', ')}`)
}

console.log(`\n${errors === 0 ? '✓ all checks passed' : `✗ ${errors} issue(s) found`}`)
process.exit(errors === 0 ? 0 : 1)
