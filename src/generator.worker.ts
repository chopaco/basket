type Position = 'G' | 'F' | 'C' | ''

type Game = {
  gameNumber: number
  players: string[]
}

type GenerateRequest = {
  players: string[]
  gameCount: number
  usePositions: boolean
  positions: Record<string, Position>
}

type Candidate = {
  players: string[]
  key: string
  rests: string[]
  pairKeys: string[]
  positionCounts: Record<'G' | 'F' | 'C', number>
}

const TEAM_SIZE = 5

const combinations = (
  values: string[],
  size: number
) => {
  const result: string[][] = []

  const visit = (
    start: number,
    selected: string[]
  ) => {
    if (selected.length === size) {
      result.push([...selected])
      return
    }

    for (
      let index = start;
      index <= values.length - (size - selected.length);
      index++
    ) {
      selected.push(values[index])
      visit(index + 1, selected)
      selected.pop()
    }
  }

  visit(0, [])
  return result
}

const shuffle = <T>(values: T[]) => {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[next]] = [result[next], result[index]]
  }

  return result
}

const createTargets = (
  players: string[],
  gameCount: number
) => {
  const totalSlots = gameCount * TEAM_SIZE
  const base = Math.floor(totalSlots / players.length)
  const extra = totalSlots % players.length
  const priority = shuffle(players)
  const targets: Record<string, number> = {}

  priority.forEach((player, index) => {
    targets[player] = base + (index < extra ? 1 : 0)
  })

  return targets
}

const buildCandidates = (
  players: string[],
  positions: Record<string, Position>
): Candidate[] => combinations(players, TEAM_SIZE).map((team) => {
  const sorted = [...team].sort()
  const teamSet = new Set(team)
  const pairKeys: string[] = []
  const positionCounts = { G: 0, F: 0, C: 0 }

  for (let left = 0; left < sorted.length; left++) {
    const position = positions[sorted[left]]
    if (position) positionCounts[position]++

    for (let right = left + 1; right < sorted.length; right++) {
      pairKeys.push(`${sorted[left]}|${sorted[right]}`)
    }
  }

  return {
    players: team,
    key: sorted.join('|'),
    rests: players.filter((player) => !teamSet.has(player)),
    pairKeys,
    positionCounts,
  }
})

const maxStreak = (
  schedule: Candidate[],
  player: string,
  playing: boolean
) => {
  let streak = 0

  for (let index = schedule.length - 1; index >= 0; index--) {
    if (schedule[index].players.includes(player) !== playing) break
    streak++
  }

  return streak
}

const positionPenalty = (
  candidate: Candidate,
  request: GenerateRequest
) => {
  if (!request.usePositions) return 0

  const pool = { G: 0, F: 0, C: 0 }
  request.players.forEach((player) => {
    const position = request.positions[player]
    if (position) pool[position]++
  })

  let penalty = 0
  ;(['G', 'F', 'C'] as const).forEach((position) => {
    const count = candidate.positionCounts[position]
    if (pool[position] > 0 && count === 0) penalty += 120000
    if (count > 2) penalty += (count - 2) * 50000
  })

  return penalty
}

const candidateScore = (
  candidate: Candidate,
  schedule: Candidate[],
  counts: Record<string, number>,
  targets: Record<string, number>,
  teamCounts: Record<string, number>,
  pairCounts: Record<string, number>,
  request: GenerateRequest
) => {
  let score = positionPenalty(candidate, request)
  const playing = new Set(candidate.players)

  request.players.forEach((player) => {
    const nextCount = counts[player] + (playing.has(player) ? 1 : 0)
    const remaining = request.gameCount - schedule.length - 1

    if (nextCount > targets[player]) score += 2_000_000
    if (nextCount + remaining < targets[player]) score += 2_000_000

    const difference = targets[player] - nextCount
    score += difference * difference * 2400

    const streak = maxStreak(schedule, player, playing.has(player)) + 1
    if (playing.has(player)) {
      if (streak >= 6) score += 5_000_000
      else if (streak >= 4) score += 180_000
      else if (streak === 3) score += 16_000
    } else {
      if (streak >= 4) score += 900_000
      else if (streak >= 3) score += 90_000
      else if (streak === 2) score += 7000
    }
  })

  const repeats = teamCounts[candidate.key] || 0
  if (repeats === 1) score += 100
  if (repeats === 2) score += 2500
  if (repeats >= 3) score += 10000 + (repeats - 3) * 5000

  candidate.pairKeys.forEach((key) => {
    const repeatsForPair = pairCounts[key] || 0
    score += repeatsForPair * repeatsForPair * 22
  })

  if (schedule.at(-1)?.key === candidate.key) score += 2000

  return score + Math.random() * 80
}

const finalScore = (
  schedule: Candidate[],
  request: GenerateRequest,
  targets: Record<string, number>
) => {
  const counts: Record<string, number> = Object.fromEntries(
    request.players.map((player) => [player, 0])
  )
  const teamCounts: Record<string, number> = {}

  schedule.forEach((candidate) => {
    candidate.players.forEach((player) => counts[player]++)
    teamCounts[candidate.key] = (teamCounts[candidate.key] || 0) + 1
  })

  let primary = 0
  request.players.forEach((player) => {
    const difference = counts[player] - targets[player]
    primary += difference * difference * 1_000_000

    const plays = schedule.map((candidate) => candidate.players.includes(player))
    for (let index = 0; index < plays.length; index++) {
      let streak = 1
      while (index + streak < plays.length && plays[index + streak] === plays[index]) {
        streak++
      }
      if (plays[index] && streak >= 4) primary += (streak - 3) * 160_000
      if (!plays[index] && streak >= 3) primary += (streak - 2) * 100_000
      index += streak - 1
    }
  })

  let duplicate = 0
  Object.values(teamCounts).forEach((count) => {
    if (count === 2) duplicate += 1
    if (count === 3) duplicate += 10
    if (count >= 4) duplicate += 40 + (count - 4) * 40
  })

  return { primary, duplicate }
}

const generate = (request: GenerateRequest): Game[] => {
  const candidates = buildCandidates(request.players, request.positions)
  const settings = request.players.length <= 7
    ? { targetAttempts: 12, attempts: 12 }
    : request.players.length === 8
      ? { targetAttempts: 8, attempts: 7 }
      : request.players.length === 9
        ? { targetAttempts: 5, attempts: 4 }
        : { targetAttempts: 4, attempts: 3 }

  let best: Candidate[] | null = null
  let bestPrimary = Infinity
  let bestDuplicate = Infinity

  for (let targetTry = 0; targetTry < settings.targetAttempts; targetTry++) {
    const targets = createTargets(request.players, request.gameCount)

    for (let attempt = 0; attempt < settings.attempts; attempt++) {
      const schedule: Candidate[] = []
      const counts: Record<string, number> = Object.fromEntries(
        request.players.map((player) => [player, 0])
      )
      const teamCounts: Record<string, number> = {}
      const pairCounts: Record<string, number> = {}

      for (let game = 0; game < request.gameCount; game++) {
        let selected: Candidate | null = null
        let selectedScore = Infinity

        candidates.forEach((candidate) => {
          const score = candidateScore(
            candidate,
            schedule,
            counts,
            targets,
            teamCounts,
            pairCounts,
            request
          )

          if (score < selectedScore) {
            selected = candidate
            selectedScore = score
          }
        })

        if (!selected) break
        const chosen = selected as Candidate
        schedule.push(chosen)
        chosen.players.forEach((player) => counts[player]++)
        teamCounts[chosen.key] = (teamCounts[chosen.key] || 0) + 1
        chosen.pairKeys.forEach((key) => {
          pairCounts[key] = (pairCounts[key] || 0) + 1
        })
      }

      if (schedule.length !== request.gameCount) continue
      const score = finalScore(schedule, request, targets)

      if (
        score.primary < bestPrimary - 500 ||
        (Math.abs(score.primary - bestPrimary) <= 500 && score.duplicate < bestDuplicate)
      ) {
        best = schedule
        bestPrimary = score.primary
        bestDuplicate = score.duplicate
      }
    }
  }

  if (!best) throw new Error('生成結果を作成できませんでした')

  return best.map((candidate, index) => ({
    gameNumber: index + 1,
    players: [...candidate.players],
  }))
}

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  try {
    self.postMessage({ type: 'complete', games: generate(event.data) })
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : '生成に失敗しました',
    })
  }
}

