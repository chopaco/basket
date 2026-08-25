export type Position = 'G' | 'F' | 'C' | ''

export type Game = {
  gameNumber: number
  players: string[]
}

type PositionCounts = {
  G: number
  F: number
  C: number
}

type TeamCandidate = {
  players: string[]
  key: string
  restKey: string
  pairKeys: string[]
  positionCounts: PositionCounts
}

type Stats = {
  plays: number
  rests: number
  maxPlayStreak: number
  maxRestStreak: number
  threePlus: number
}

export type GenerateRequest = {
  players: string[]
  gameCount: number
  usePositions: boolean
  positions: Record<string, Position>
}

const TEAM_SIZE = 5

export const generateGames = (
  request: GenerateRequest
): Game[] => {
  const {
    players,
    gameCount,
    usePositions,
    positions,
  } = request

  const teamKey = (team: string[]) =>
    [...team].sort().join('|')

  const pairKey = (a: string, b: string) =>
    [a, b].sort().join('|')

  const restGroupKey = (team: string[]) =>
    players
      .filter(
        (player) =>
          !team.includes(player)
      )
      .sort()
      .join('|')

  // =========================================================
  // シャッフル
  // =========================================================

  const shuffle = <T,>(
    values: T[]
  ) => {
    const result =
      [...values]

    for (
      let i =
        result.length - 1;
      i > 0;
      i--
    ) {
      const j =
        Math.floor(
          Math.random() *
          (i + 1)
        )

      ;[
        result[i],
        result[j],
      ] = [
        result[j],
        result[i],
      ]
    }

    return result
  }

  // =========================================================
  // 目標出場回数
  //
  // 全出場枠をできるだけ均等に配分。
  //
  // 例：
  // 7人・16試合
  // 80枠
  //
  // 12回 × 3人
  // 11回 × 4人
  //
  // +1になる人はランダム。
  // =========================================================

  const getTargetPlays = () => {
    const totalSlots =
      gameCount *
      TEAM_SIZE

    const base =
      Math.floor(
        totalSlots /
        players.length
      )

    const remainder =
      totalSlots %
      players.length

    const shuffled =
      shuffle(players)

    const result:
      Record<
        string,
        number
      > = {}

    players.forEach(
      (player) => {
        result[player] =
          base
      }
    )

    for (
      let i = 0;
      i < remainder;
      i++
    ) {
      result[
        shuffled[i]
      ]++
    }

    return result
  }

  // =========================================================
  // 統計
  // =========================================================

  const calculateStats = (
    schedule: Game[]
  ): Record<
    string,
    Stats
  > => {
    const result:
      Record<
        string,
        Stats
      > = {}

    players.forEach(
      (player) => {
        result[player] = {
          plays: 0,
          rests: 0,
          maxPlayStreak: 0,
          maxRestStreak: 0,
          threePlus: 0,
        }
      }
    )

    players.forEach(
      (player) => {
        let playStreak = 0
        let restStreak = 0

        schedule.forEach(
          (game) => {
            const playing =
              game.players.includes(
                player
              )

            if (playing) {
              result[
                player
              ].plays++

              restStreak = 0
              playStreak++

              result[
                player
              ].maxPlayStreak =
                Math.max(
                  result[
                    player
                  ].maxPlayStreak,
                  playStreak
                )
            } else {
              if (
                playStreak >= 3
              ) {
                result[
                  player
                ].threePlus++
              }

              playStreak = 0

              restStreak++

              result[
                player
              ].rests++

              result[
                player
              ].maxRestStreak =
                Math.max(
                  result[
                    player
                  ].maxRestStreak,
                  restStreak
                )
            }
          }
        )

        if (
          playStreak >= 3
        ) {
          result[
            player
          ].threePlus++
        }
      }
    )

    return result
  }

  // =========================================================
  // 5人組
  // =========================================================

  const getTeamCounts = (
    schedule: Game[]
  ) => {
    const counts:
      Record<
        string,
        number
      > = {}

    schedule.forEach(
      (game) => {
        const key =
          teamKey(
            game.players
          )

        counts[key] =
          (
            counts[key] ||
            0
          ) + 1
      }
    )

    return counts
  }

  // =========================================================
  // 一緒に出場した2人組
  // =========================================================

  const getPairCounts = (
    schedule: Game[]
  ) => {
    const counts:
      Record<
        string,
        number
      > = {}

    schedule.forEach(
      (game) => {
        for (
          let i = 0;
          i <
          game.players.length;
          i++
        ) {
          for (
            let j =
              i + 1;
            j <
            game.players.length;
            j++
          ) {
            const key =
              pairKey(
                game.players[i],
                game.players[j]
              )

            counts[key] =
              (
                counts[key] ||
                0
              ) + 1
          }
        }
      }
    )

    return counts
  }

  // =========================================================
  // 現在の連続出場
  // =========================================================

  const currentPlayStreak = (
    schedule: Game[],
    player: string
  ) => {
    let streak = 0

    for (
      let i =
        schedule.length - 1;
      i >= 0;
      i--
    ) {
      if (
        schedule[
          i
        ].players.includes(
          player
        )
      ) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  // =========================================================
  // 実現可能性
  // =========================================================

  const isFeasible = (
    schedule: Game[],
    target:
      Record<
        string,
        number
      >
  ) => {
    const stats =
      calculateStats(
        schedule
      )

    const remainingGames =
      gameCount -
      schedule.length

    for (
      const player
      of players
    ) {
      const current =
        stats[
          player
        ].plays

      const remainingNeeded =
        target[player] -
        current

      if (
        remainingNeeded < 0
      ) {
        return false
      }

      if (
        remainingNeeded >
        remainingGames
      ) {
        return false
      }
    }

    return true
  }

  // =========================================================
  // ★9.4
  //
  // N人から5人を選ぶ全組み合わせ
  //
  // 6人 → 6通り
  // 7人 → 21通り
  // 8人 → 56通り
  // 9人 → 126通り
  // =========================================================

  const getTeamCandidates = () => {
    const result:
      TeamCandidate[] = []

    const createCandidate = (
      team: string[]
    ): TeamCandidate => {
      const pairKeys: string[] = []
      const positionCounts:
        PositionCounts = {
          G: 0,
          F: 0,
          C: 0,
        }

      team.forEach(
        (player, index) => {
          const playerPosition =
            positions[player]

          if (
            playerPosition === 'G' ||
            playerPosition === 'F' ||
            playerPosition === 'C'
          ) {
            positionCounts[
              playerPosition
            ]++
          }

          for (
            let pairIndex = index + 1;
            pairIndex < team.length;
            pairIndex++
          ) {
            pairKeys.push(
              pairKey(
                player,
                team[pairIndex]
              )
            )
          }
        }
      )

      return {
        players: team,
        key: teamKey(team),
        restKey: restGroupKey(team),
        pairKeys,
        positionCounts,
      }
    }

    const build = (
      start: number,
      current: string[]
    ) => {
      if (
        current.length ===
        TEAM_SIZE
      ) {
        result.push(
          createCandidate([
            ...current,
          ])
        )

        return
      }

      const needed =
        TEAM_SIZE -
        current.length

      for (
        let i = start;
        i <=
        players.length -
          needed;
        i++
      ) {
        current.push(
          players[i]
        )

        build(
          i + 1,
          current
        )

        current.pop()
      }
    }

    build(
      0,
      []
    )

    return shuffle(
      result
    )
  }

  // =========================================================
  // 休憩グループ周期性
  //
  // 「同じ休憩メンバー」が
  // 人数周期で繰り返されることを抑える。
  //
  // 7人なら
  // 試1→8→15のような繰り返し。
  // =========================================================

  const calculateRestCyclePenalty = (
    schedule: Game[]
  ) => {
    let penalty = 0

    const period =
      players.length

    for (
      let i = 0;
      i <
      schedule.length;
      i++
    ) {
      const keyA =
        restGroupKey(
          schedule[
            i
          ].players
        )

      for (
        let j =
          i + 1;
        j <
        schedule.length;
        j++
      ) {
        const keyB =
          restGroupKey(
            schedule[
              j
            ].players
          )

        if (
          keyA !== keyB
        ) {
          continue
        }

        const distance =
          j - i

        if (
          distance ===
          period
        ) {
          penalty +=
            50000
        }

        if (
          distance ===
          period * 2
        ) {
          penalty +=
            120000
        }

        if (
          distance <= 4
        ) {
          penalty +=
            10000
        }
      }
    }

    return penalty
  }

// =========================================================
// 候補評価
// =========================================================

const calculatePositionPenalty = (
  team: string[],
  target?: Record<
    string,
    number
  >,
  precomputedPositionCounts?:
    PositionCounts
) => {
  // ポジション設定を使わない場合は
  // ポジション評価を完全に無効化
  if (!usePositions) {
    return 0
  }

  const poolCounts = {
    G: 0,
    F: 0,
    C: 0,
  }

  players.forEach(
    (player) => {
      const pos =
        positions[player]

      if (pos === 'G') {
        poolCounts.G++
      }

      if (pos === 'F') {
        poolCounts.F++
      }

      if (pos === 'C') {
        poolCounts.C++
      }
    }
  )

  const teamCounts =
    precomputedPositionCounts || {
      G: 0,
      F: 0,
      C: 0,
    }

  if (!precomputedPositionCounts) {
    team.forEach(
      (player) => {
        const pos =
          positions[player]

        if (pos === 'G') {
          teamCounts.G++
        }

        if (pos === 'F') {
          teamCounts.F++
        }

        if (pos === 'C') {
          teamCounts.C++
        }
      }
    )
  }

  // =======================================================
  // そのポジションの
  // 目標出場回数合計
  // =======================================================

  const getTargetPlaysByPosition = (
    pos: 'G' | 'F' | 'C'
  ) => {
    if (!target) {
      return 0
    }

    return players
      .filter(
        (player) =>
          positions[player] ===
          pos
      )
      .reduce(
        (
          sum,
          player
        ) =>
          sum +
          target[player],
        0
      )
  }

  // =======================================================
  // 最低1名を全試合で維持可能か
  // =======================================================

  const canKeepMinOne = (
    pos: 'G' | 'F' | 'C'
  ) => {
    if (
      poolCounts[pos] === 0
    ) {
      return false
    }

    if (!target) {
      return true
    }

    const requiredPlays =
      getTargetPlaysByPosition(
        pos
      )

    return (
      requiredPlays >=
      gameCount
    )
  }

  // =======================================================
  // 最大2名を全試合で維持可能か
  // =======================================================

  const canKeepMaxTwo = (
    pos: 'G' | 'F' | 'C'
  ) => {
    if (!target) {
      return true
    }

    const requiredPlays =
      getTargetPlaysByPosition(
        pos
      )

    const maxAvailable =
      gameCount * 2

    return (
      requiredPlays <=
      maxAvailable
    )
  }

  const enforceMinG =
    canKeepMinOne('G')

  const enforceMinF =
    canKeepMinOne('F')

  const enforceMinC =
    canKeepMinOne('C')

  const enforceMaxG =
    canKeepMaxTwo('G')

  const enforceMaxF =
    canKeepMaxTwo('F')

  const enforceMaxC =
    canKeepMaxTwo('C')

  let penalty = 0

  // =======================================================
  // 最低1名
  //
  // 実現可能なら強く優先
  // =======================================================

  if (
    enforceMinG &&
    teamCounts.G === 0
  ) {
    penalty += 100000
  }

  if (
    enforceMinF &&
    teamCounts.F === 0
  ) {
    penalty += 100000
  }

  if (
    enforceMinC &&
    teamCounts.C === 0
  ) {
    penalty += 100000
  }

  // =======================================================
  // 最大2名
  //
  // 実現可能なら優先
  // =======================================================

  if (
    enforceMaxG &&
    teamCounts.G > 2
  ) {
    penalty +=
      (
        teamCounts.G -
        2
      ) *
      50000
  }

  if (
    enforceMaxF &&
    teamCounts.F > 2
  ) {
    penalty +=
      (
        teamCounts.F -
        2
      ) *
      50000
  }

  if (
    enforceMaxC &&
    teamCounts.C > 2
  ) {
    penalty +=
      (
        teamCounts.C -
        2
      ) *
      50000
  }

  // =======================================================
  // 最大2名を維持できないポジション
  //
  // 4名以上になる極端な偏りだけ
  // 軽く避ける
  // =======================================================

  if (
    !enforceMaxG &&
    teamCounts.G >= 4
  ) {
    penalty += 1000
  }

  if (
    !enforceMaxF &&
    teamCounts.F >= 4
  ) {
    penalty += 1000
  }

  if (
    !enforceMaxC &&
    teamCounts.C >= 4
  ) {
    penalty += 1000
  }

  return penalty
}

  const evaluateCandidate = (
    schedule: Game[],
    candidate: Game,
    candidateInfo: TeamCandidate,
    target:
      Record<
        string,
        number
      >
  ) => {
    const testSchedule = [
      ...schedule,
      candidate,
    ]

    if (
      !isFeasible(
        testSchedule,
        target
      )
    ) {
      return Infinity
    }

    const stats =
      calculateStats(
        testSchedule
      )

    let score = 0


    // =======================================================
    // ① 出場回数
    // =======================================================

    players.forEach(
      (player) => {
        const difference =
          stats[
            player
          ].plays -
          target[
            player
          ]

        if (
          difference > 0
        ) {
          score +=
            difference *
            100000000
        }
      }
    )

    // =======================================================
    // ② 残り試合で目標達成可能か
    // =======================================================

    const remainingGames =
      gameCount -
      testSchedule.length

    players.forEach(
      (player) => {
        const need =
          target[
            player
          ] -
          stats[
            player
          ].plays

        if (
          need >
          remainingGames
        ) {
          score +=
            1000000000
        }
      }
    )

    // =======================================================
    // ③ 3連続以上の偏り
    // =======================================================

    const threeCounts =
      players.map(
        (player) =>
          stats[
            player
          ].threePlus
      )

    const maxThree =
      Math.max(
        ...threeCounts
      )

    const minThree =
      Math.min(
        ...threeCounts
      )

    score +=
      (
        maxThree -
        minThree
      ) *
      250000

    score +=
      threeCounts.reduce(
        (
          sum,
          value
        ) =>
          sum + value,
        0
      ) *
      2500

// =======================================================
// ④ 連続出場
//
// ★9.4.1
//
// 6人の場合は毎試合5人出場なので、
// 3～5連続程度はある程度避けられない。
//
// その代わり、
// 「6連続以上」を特に強く避ける。
//
// 7～12人については従来の評価を維持。
// =======================================================

players.forEach(
  (player) => {
    const streak =
      stats[
        player
      ].maxPlayStreak

    if (
      players.length === 6
    ) {
      // -----------------------------------------------
      // 6人の場合
      // -----------------------------------------------

      // 4連続
      // → 軽いペナルティ
      if (
        streak === 4
      ) {
        score +=
          20000
      }

      // 5連続
      // → できれば避けたい
      if (
        streak === 5
      ) {
        score +=
          150000
      }

      // 6連続以上
      // → 強く避ける
      if (
        streak >= 6
      ) {
        score +=
          1500000 +
          (
            streak -
            6
          ) *
          1500000
      }
    } else {
      // -----------------------------------------------
      // 7～9人
      // 従来の評価
      // -----------------------------------------------

      if (
        streak >= 4
      ) {
        score +=
          (
            streak -
            3
          ) *
          5000000
      }
    }
  }
)
    // =======================================================
    // ⑤ 現在2連続以上 → 次の出場を少し抑える
    // =======================================================

    candidate.players.forEach(
      (player) => {
        const before =
          currentPlayStreak(
            schedule,
            player
          )

        if (
          before >= 2
        ) {
          score +=
            5000
        }
      }
    )

    // =======================================================
    // ⑥ 休憩回数の差
    // =======================================================

    const restCounts =
      players.map(
        (player) =>
          stats[
            player
          ].rests
      )

    score +=
      (
        Math.max(
          ...restCounts
        ) -
        Math.min(
          ...restCounts
        )
      ) *
      10000

    // =======================================================
    // ⑦ 最長休憩
    //
    // 8～12人では連続休憩が必要になる場合もあるので
    // 「禁止」ではなく偏りを評価。
    // =======================================================

    const longestRests =
      players.map(
        (player) =>
          stats[
            player
          ].maxRestStreak
      )

    const maxLongestRest =
      Math.max(
        ...longestRests
      )

    const minLongestRest =
      Math.min(
        ...longestRests
      )

    score +=
      (
        maxLongestRest -
        minLongestRest
      ) *
      12000

    // 長すぎる連続休憩自体も少し避ける
    players.forEach(
      (player) => {
        const streak =
          stats[
            player
          ].maxRestStreak

        if (
          streak >= 3
        ) {
          score +=
            (
              streak -
              2
            ) *
            100000
        }
      }
    )

    // =======================================================
    // ⑧ 休憩グループの周期性
    // =======================================================

    const candidateRestKey =
      candidateInfo.restKey

    let sameRestCount = 0

    for (
      let i = 0;
      i <
      schedule.length;
      i++
    ) {
      const pastRestKey =
        restGroupKey(
          schedule[
            i
          ].players
        )

      if (
        pastRestKey !==
        candidateRestKey
      ) {
        continue
      }

      sameRestCount++

      const distance =
        schedule.length -
        i

      const period =
        players.length

      if (
        distance ===
        period
      ) {
        score +=
          50000
      }

      if (
        distance ===
        period * 2
      ) {
        score +=
          120000
      }

      if (
        distance <= 4
      ) {
        score +=
          10000
      }
    }

if (
  sameRestCount >= 2
) {
  score +=
    80000
}

// =======================================================
// ⑨ ポジションバランス
//
// 優先順位：
// 出場回数
// ＞ 連続出場
// ＞ 連続休憩
// ＞ ポジション
// ＞＞＞ 5人組重複
//
// G / F / C が設定されている場合、
// 可能なら各1～2名になるようにする。
// =======================================================

score +=
  calculatePositionPenalty(
    candidate.players,
    target,
    candidateInfo.positionCounts
  )

// =======================================================
// ⑩ 5人組の重複
// =======================================================
    const teamCounts =
      getTeamCounts(
        testSchedule
      )

    const newTeamKey =
      candidateInfo.key

    const newTeamCount =
      teamCounts[
        newTeamKey
      ] || 0

if (
  newTeamCount === 2
) {
  score +=
    100
}

if (
  newTeamCount === 3
) {
  score +=
    2500
}

if (
  newTeamCount >= 4
) {
  score +=
    10000 +
    (
      newTeamCount -
      4
    ) *
    5000
}

    // =======================================================
    // ⑩ 直前と完全に同じ5人
    // =======================================================

    if (
      schedule.length > 0
    ) {
      const previous =
        schedule[
          schedule.length -
          1
        ]

      if (
        teamKey(
          previous.players
        ) ===
        newTeamKey
      ) {
        score +=
          2000
      }
    }

    // =======================================================
    // ⑪ 一緒に出る2人組
    // =======================================================

    const pairCounts =
      getPairCounts(
        testSchedule
      )

    candidateInfo.pairKeys.forEach(
      (key) => {
        const count =
          pairCounts[key] || 0

        // 人数によって平均同席回数が違うので
        // 非常に強くは評価しない
        if (count >= 5) {
          score +=
            (
              count - 4
            ) * 400
        }
      }
    )

    // =======================================================
    // ⑫ ランダム性
    // =======================================================

    score +=
      Math.random() *
      1000

    return score
  }

  // =========================================================
  // 1パターン生成
  // =========================================================

  const generateOne = (
    target:
      Record<
        string,
        number
      >,
    allTeams: TeamCandidate[]
  ) => {
    const schedule:
      Game[] = []

    for (
      let gameIndex = 0;
      gameIndex <
      gameCount;
      gameIndex++
    ) {
      // 毎試合候補順を少し変える
      const candidates =
        shuffle(
          allTeams
        )

      let bestCandidate:
        Game | null =
        null

      let bestScore =
        Infinity

      for (
        const team
        of candidates
      ) {
        const candidate:
          Game = {
          gameNumber:
            gameIndex + 1,

          players: [
            ...team.players,
          ],
        }

        const score =
          evaluateCandidate(
            schedule,
            candidate,
            team,
            target
          )

        if (
          score <
          bestScore
        ) {
          bestScore =
            score

          bestCandidate =
            candidate
        }
      }

      if (
        !bestCandidate
      ) {
        return null
      }

      schedule.push(
        bestCandidate
      )
    }

    return schedule
  }

  // =========================================================
  // 最終評価
  // =========================================================

  const calculateDuplicateScore = (
    schedule: Game[]
  ) => {
    const teamCounts =
      getTeamCounts(schedule)

    return Object.values(
      teamCounts
    ).reduce(
      (
        duplicateScore,
        count
      ) => {
        if (count === 2) {
          return duplicateScore + 1
        }

        if (count === 3) {
          return duplicateScore + 10
        }

        if (count >= 4) {
          return (
            duplicateScore +
            40 +
            (count - 4) * 40
          )
        }

        return duplicateScore
      },
      0
    )
  }

  const finalScore = (
    schedule: Game[],
    target:
      Record<
        string,
        number
      >
  ) => {
    const stats =
      calculateStats(
        schedule
      )

    let score = 0

    // =======================================================
    // ① 出場回数
    // =======================================================

    const playCounts =
      players.map(
        (player) =>
          stats[
            player
          ].plays
      )

    score +=
      (
        Math.max(
          ...playCounts
        ) -
        Math.min(
          ...playCounts
        )
      ) *
      100000000

    players.forEach(
      (player) => {
        score +=
          Math.abs(
            stats[
              player
            ].plays -
            target[
              player
            ]
          ) *
          100000000
      }
    )

    // =======================================================
    // ② 3連続以上
    // =======================================================

    const threeCounts =
      players.map(
        (player) =>
          stats[
            player
          ].threePlus
      )

    const maxThree =
      Math.max(
        ...threeCounts
      )

    const minThree =
      Math.min(
        ...threeCounts
      )

    score +=
      (
        maxThree -
        minThree
      ) *
      3000000

    const avgThree =
      threeCounts.reduce(
        (a, b) =>
          a + b,
        0
      ) /
      threeCounts.length

    threeCounts.forEach(
      (value) => {
        score +=
          Math.abs(
            value -
            avgThree
          ) *
          100000
      }
    )

// =======================================================
// ③ 連続出場
//
// ★9.4.1
//
// 6人では「4連続をゼロ」にするより、
// 5～6連続以上を減らして
// 休憩位置を分散させることを優先する。
// =======================================================

players.forEach(
  (player) => {
    const streak =
      stats[
        player
      ].maxPlayStreak

    if (
      players.length === 6
    ) {
      // 4連続は許容
      if (
        streak === 4
      ) {
        score +=
          50000
      }

      // 5連続は少し強く嫌う
      if (
        streak === 5
      ) {
        score +=
          500000
      }

      // 6連続以上はかなり強く嫌う
      if (
        streak >= 6
      ) {
        score +=
          5000000 +
          (
            streak -
            6
          ) *
          5000000
      }
    } else {
      // 7～12人は従来通り
      if (
        streak >= 4
      ) {
        score +=
          (
            streak -
            3
          ) *
          10000000
      }
    }
  }
)
    // =======================================================
    // ④ 休憩回数
    // =======================================================

    const restCounts =
      players.map(
        (player) =>
          stats[
            player
          ].rests
      )

    score +=
      (
        Math.max(
          ...restCounts
        ) -
        Math.min(
          ...restCounts
        )
      ) *
      500000

    // =======================================================
    // ⑤ 最長休憩
    // =======================================================

    const longestRests =
      players.map(
        (player) =>
          stats[
            player
          ].maxRestStreak
      )

    score +=
      (
        Math.max(
          ...longestRests
        ) -
        Math.min(
          ...longestRests
        )
      ) *
      50000

    players.forEach(
      (player) => {
        const streak =
          stats[
            player
          ].maxRestStreak

        if (
          streak >= 3
        ) {
          score +=
            (
              streak -
              2
            ) *
            200000
        }
      }
    )

// =======================================================
// ⑥ 休憩グループ周期
// =======================================================

score +=
  calculateRestCyclePenalty(
    schedule
  )

// =======================================================
// ⑦ ポジションバランス
//
// 出場回数
// ＞ 連続出場
// ＞ 連続休憩
// ＞ ポジション
// ＞＞＞ 5人組重複
// =======================================================

schedule.forEach(
  (game) => {
    score +=
      calculatePositionPenalty(
        game.players,
        target
      )
  }
)

    return {
      primary: score,
      duplicate:
        calculateDuplicateScore(
          schedule
        ),
    }
  }

  // =========================================================
  // 人数別の試行回数
  //
  // 9人は候補126通りなので、
  // 7人より試行数を減らす。
  // =========================================================

  const getGenerationSettings = () => {
    switch (
      players.length
    ) {
      case 6:
        return {
          targetAttempts: 12,
          attempts: 12,
        }

      case 7:
        return {
          targetAttempts: 12,
          attempts: 12,
        }

      case 8:
        return {
          targetAttempts: 8,
          attempts: 7,
        }

      case 9:
        return {
          targetAttempts: 5,
          attempts: 4,
        }

      default:
        return {
          targetAttempts: 4,
          attempts: 3,
        }
    }
  }
      let globalBest:
        Game[] | null =
        null

      let globalBestPrimary =
        Infinity

      let globalBestDuplicate =
        Infinity

      const allTeams =
        getTeamCandidates()

      const {
        targetAttempts,
        attempts,
      } =
        getGenerationSettings()

      for (
        let targetTry = 0;
        targetTry <
        targetAttempts;
        targetTry++
      ) {
        const target =
          getTargetPlays()

        for (
          let i = 0;
          i <
          attempts;
          i++
        ) {
          const result =
            generateOne(
              target,
              allTeams
            )

          if (!result) {
            continue
          }

          const score =
            finalScore(
              result,
              target
            )

          const primaryTolerance =
            500

          if (
            score.primary <
            globalBestPrimary -
            primaryTolerance
          ) {
            globalBestPrimary =
              score.primary

            globalBestDuplicate =
              score.duplicate

            globalBest =
              result
          } else if (
            Math.abs(
              score.primary -
              globalBestPrimary
            ) <=
            primaryTolerance
          ) {
            if (
              score.duplicate <
              globalBestDuplicate
            ) {
              globalBestPrimary =
                score.primary

              globalBestDuplicate =
                score.duplicate

              globalBest =
                result
            } else if (
              score.duplicate ===
                globalBestDuplicate &&
              Math.random() < 0.35
            ) {
              globalBestPrimary =
                score.primary

              globalBestDuplicate =
                score.duplicate

              globalBest =
                result
            }
          }
        }
      }


  if (!globalBest) {
    throw new Error(
      '条件を満たす組み合わせを作成できませんでした'
    )
  }

  return globalBest
}
