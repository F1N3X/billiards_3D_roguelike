/**
 * Seeds the database with test users and game histories.
 * Requires the backend running (docker-compose up or npm run start:dev in backend/).
 * Run: npx tsx scripts/seed-db.ts [base_url]
 * Example: npx tsx scripts/seed-db.ts http://localhost:3000
 * Exit: 0 = all done, 1 = fatal error
 */

const BASE = process.argv[2] ?? 'http://localhost:3000'

const USERS = [
  { pseudo: 'player_one', email: 'player1@seed.local',  password: 'Seed1234!' },
  { pseudo: 'player_two', email: 'player2@seed.local',  password: 'Seed1234!' },
  { pseudo: 'champion',   email: 'champion@seed.local', password: 'Seed1234!' },
]

type GameMode = 'classic' | 'rumble'

const GAMES: { pseudo: string; gameMode: GameMode; score: number; shots: number }[] = [
  { pseudo: 'player_one', gameMode: 'classic', score: 1200, shots: 10 },
  { pseudo: 'player_one', gameMode: 'classic', score: 2400, shots: 6  },
  { pseudo: 'player_two', gameMode: 'classic', score: 800,  shots: 14 },
  { pseudo: 'player_two', gameMode: 'rumble',  score: 3500, shots: 8  },
  { pseudo: 'champion',   gameMode: 'classic', score: 4200, shots: 4  },
  { pseudo: 'champion',   gameMode: 'classic', score: 3800, shots: 5  },
  { pseudo: 'champion',   gameMode: 'rumble',  score: 7200, shots: 12 },
]

async function post<T>(path: string, body: unknown, token?: string): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null) as T
  return { ok: res.ok, status: res.status, data }
}

interface LoginResponse { user: { _id: string }; token: string }
interface SessionResponse { sessionId: string }

async function main(): Promise<void> {
  console.log(`Seeding database at ${BASE}\n`)

  // Test connectivity
  try {
    await fetch(`${BASE}/users`)
  } catch {
    console.error(`Cannot reach ${BASE} — is the backend running?`)
    process.exit(1)
  }

  const sessions: Record<string, { userId: string; token: string }> = {}

  // Register + login each user
  console.log('--- Users ---\n')
  for (const u of USERS) {
    const reg = await post<{ _id?: string; message?: string }>('/users', u)

    if (reg.ok) {
      console.log(`  ✓  registered  ${u.pseudo}`)
    } else if (reg.status === 409) {
      console.log(`  ~  already exists  ${u.pseudo}`)
    } else {
      console.error(`  ✗  register ${u.pseudo}: ${reg.status} ${JSON.stringify(reg.data)}`)
      continue
    }

    const login = await post<LoginResponse>('/users/login', { email: u.email, password: u.password })
    if (!login.ok) {
      console.error(`  ✗  login ${u.pseudo}: ${login.status} ${JSON.stringify(login.data)}`)
      continue
    }

    sessions[u.pseudo] = { userId: String(login.data.user._id), token: login.data.token }
    console.log(`  ✓  logged in   ${u.pseudo}`)
  }

  // Seed game histories (each requires a fresh session token)
  console.log('\n--- Game histories ---\n')
  for (const g of GAMES) {
    const auth = sessions[g.pseudo]
    if (!auth) { console.error(`  ✗  no session for ${g.pseudo}, skipping`); continue }

    const sessionRes = await post<SessionResponse>(
      '/game-sessions/start',
      { gameMode: g.gameMode },
      auth.token,
    )
    if (!sessionRes.ok) {
      console.error(`  ✗  start session for ${g.pseudo}: ${sessionRes.status} ${JSON.stringify(sessionRes.data)}`)
      continue
    }

    const histRes = await post<unknown>('/game-history', {
      sessionId: sessionRes.data.sessionId,
      userId: auth.userId,
      gameMode: g.gameMode,
      score: g.score,
      shots: g.shots,
    }, auth.token)

    if (histRes.ok) {
      console.log(`  ✓  ${g.pseudo.padEnd(12)} | ${g.gameMode.padEnd(8)} | score=${g.score}  shots=${g.shots}`)
    } else {
      console.error(`  ✗  game history for ${g.pseudo}: ${histRes.status} ${JSON.stringify(histRes.data)}`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('Fatal:', (err as Error).message)
  process.exit(1)
})
