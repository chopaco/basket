import { useState } from 'react'
import './App.css'

type Game = {
  gameNumber: number
  players: string[]
}

type Stats = {
  plays: number
  rests: number
  maxPlayStreak: number
  maxRestStreak: number
  threePlus: number
}

const TEAM_SIZE = 5

function App() {
  const [name, setName] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [gameCount, setGameCount] = useState(16)
  const [games, setGames] = useState<Game[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // =========================================================
  // 基本関数
  // =========================================================

  const teamKey = (team: string[]) =>
    [...team].sort().join('|')

  const pairKey = (a: string, b: string) =>
    [a, b].sort().join('|')

  // =========================================================
  // 参加者
  // =========================================================

  const addPlayer = () => {
    const value = name.trim()

    if (!value) return

    if (players.includes(value)) {
      alert('同じ名前が登録されています')
      return
    }

    setPlayers([...players, value])
    setName('')
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
    setGames([])
  }

  // =========================================================
  // 目標出場回数
  //
  // 例：
  // 7人 × 16試合 × 5人
  // = 80出場
  //
  // 80 ÷ 7 = 11余り3
  //
  // → 3人が12回
  // → 4人が11回
  //
  // この範囲を絶対的に重視する。
  // =========================================================

  const getTargetPlays = () => {
    const totalSlots =
      gameCount * TEAM_SIZE

    const base =
      Math.floor(
        totalSlots / players.length
      )

    const remainder =
      totalSlots % players.length

    const result: Record<string, number> = {}

    players.forEach((player, index) => {
      result[player] =
        base +
        (index < remainder ? 1 : 0)
    })

    return result
  }

  // =========================================================
  // 統計
  // =========================================================

const calculateStats = (
  schedule: Game[]
): Record<string, Stats> => {
  const result: Record<string, Stats> = {}

  players.forEach((player) => {
    result[player] = {
      plays: 0,
      rests: 0,
      maxPlayStreak: 0,
      maxRestStreak: 0,
      threePlus: 0,
    }
  })

  players.forEach((player) => {
    let playStreak = 0
    let restStreak = 0

    schedule.forEach((game) => {
      const playing =
        game.players.includes(player)

      if (playing) {
        // ================================
        // 出場
        // ================================

        result[player].plays++

        // 休憩連続をリセット
        restStreak = 0

        // 出場連続を加算
        playStreak++

        // 最長出場を更新
        result[player].maxPlayStreak =
          Math.max(
            result[player].maxPlayStreak,
            playStreak
          )
      } else {
        // ================================
        // 休憩
        // ================================

        // 直前まで3連続以上だった場合
        // 「3連続以上」を1回としてカウント
        if (playStreak >= 3) {
          result[player].threePlus++
        }

        // 出場連続をリセット
        playStreak = 0

        // ★休憩回数をカウント
        result[player].rests++

        // 休憩連続を加算
        restStreak++

        // 最長休憩を更新
        result[player].maxRestStreak =
          Math.max(
            result[player].maxRestStreak,
            restStreak
          )
      }
    })import { useState } from 'react'
import './App.css'

type Game = {
  gameNumber: number
  players: string[]
}

type Stats = {
  plays: number
  rests: number
  maxPlayStreak: number
  maxRestStreak: number
  threePlus: number
}

const TEAM_SIZE = 5

function App() {
  const [name, setName] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [gameCount, setGameCount] = useState(16)
  const [games, setGames] = useState<Game[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // =========================================================
  // 基本
  // =========================================================

  const teamKey = (team: string[]) =>
    [...team].sort().join('|')

  const pairKey = (a: string, b: string) =>
    [a, b].sort().join('|')

  // =========================================================
  // 参加者
  // =========================================================

  const addPlayer = () => {
    const value = name.trim()

    if (!value) return

    if (players.includes(value)) {
      alert('同じ名前が登録されています')
      return
    }

    setPlayers([...players, value])
    setName('')
    setGames([])
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
    setGames([])
  }

  // =========================================================
  // 目標出場回数
  //
  // 例：7人 × 16試合 × 5人 = 80枠
  //
  // 80 ÷ 7 = 11余り3
  //
  // → 3人が12回
  // → 4人が11回
  //
  // ★9.1
  // 「誰が12回になるか」を毎回ランダムにする。
  // =========================================================

  const getTargetPlays = () => {
    const totalSlots = gameCount * TEAM_SIZE

    const base = Math.floor(
      totalSlots / players.length
    )

    const remainder =
      totalSlots % players.length

    // 全員をシャッフルしてから
    // remainder 人を+1にする
    const shuffled = [...players].sort(
      () => Math.random() - 0.5
    )

    const result: Record<string, number> = {}

    shuffled.forEach((player, index) => {
      result[player] =
        base + (index < remainder ? 1 : 0)
    })

    return result
  }

  // =========================================================
  // 統計
  // =========================================================

  const calculateStats = (
    schedule: Game[]
  ): Record<string, Stats> => {
    const result: Record<string, Stats> = {}

    players.forEach((player) => {
      result[player] = {
        plays: 0,
        rests: 0,
        maxPlayStreak: 0,
        maxRestStreak: 0,
        threePlus: 0,
      }
    })

    players.forEach((player) => {
      let playStreak = 0
      let restStreak = 0

      schedule.forEach((game) => {
        const playing =
          game.players.includes(player)

        if (playing) {
          result[player].plays++

          restStreak = 0
          playStreak++

          result[player].maxPlayStreak =
            Math.max(
              result[player].maxPlayStreak,
              playStreak
            )
        } else {
          // 3連続以上が終わった瞬間
          if (playStreak >= 3) {
            result[player].threePlus++
          }

          playStreak = 0
          restStreak++

          result[player].rests++

          result[player].maxRestStreak =
            Math.max(
              result[player].maxRestStreak,
              restStreak
            )
        }
      })

      // 最後まで3連続以上だった場合
      if (playStreak >= 3) {
        result[player].threePlus++
      }
    })

    return result
  }

  // =========================================================
  // 5人組
  // =========================================================

  const getTeamCounts = (
    schedule: Game[]
  ) => {
    const counts: Record<string, number> = {}

    schedule.forEach((game) => {
      const key = teamKey(game.players)

      counts[key] =
        (counts[key] || 0) + 1
    })

    return counts
  }

  // =========================================================
  // 2人組
  // =========================================================

  const getPairCounts = (
    schedule: Game[]
  ) => {
    const counts: Record<string, number> = {}

    schedule.forEach((game) => {
      for (
        let i = 0;
        i < game.players.length;
        i++
      ) {
        for (
          let j = i + 1;
          j < game.players.length;
          j++
        ) {
          const key = pairKey(
            game.players[i],
            game.players[j]
          )

          counts[key] =
            (counts[key] || 0) + 1
        }
      }
    })

    return counts
  }

  // =========================================================
  // 現在の出場連続
  // =========================================================

  const currentPlayStreak = (
    schedule: Game[],
    player: string
  ) => {
    let streak = 0

    for (
      let i = schedule.length - 1;
      i >= 0;
      i--
    ) {
      if (
        schedule[i].players.includes(
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
  // 現在の休憩連続
  // =========================================================

  const currentRestStreak = (
    schedule: Game[],
    player: string
  ) => {
    let streak = 0

    for (
      let i = schedule.length - 1;
      i >= 0;
      i--
    ) {
      if (
        !schedule[i].players.includes(
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
    target: Record<string, number>
  ) => {
    const stats =
      calculateStats(schedule)

    const remainingGames =
      gameCount - schedule.length

    for (const player of players) {
      const current =
        stats[player].plays

      const remainingNeeded =
        target[player] - current

      if (remainingNeeded < 0) {
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
  // 休む2人の候補
  // =========================================================

  const getRestPairs = () => {
    const result: [string, string][] = []

    for (
      let i = 0;
      i < players.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < players.length;
        j++
      ) {
        result.push([
          players[i],
          players[j],
        ])
      }
    }

    // ★9.1
    // 候補順も毎回シャッフル。
    // 同点候補に偏りが出にくくなる。
    return result.sort(
      () => Math.random() - 0.5
    )
  }

  // =========================================================
  // 候補評価
  // =========================================================

  const evaluateCandidate = (
    schedule: Game[],
    candidate: Game,
    target: Record<string, number>
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
      calculateStats(testSchedule)

    let score = 0

    // =======================================================
    // ① 出場回数
    // =======================================================

    players.forEach((player) => {
      const difference =
        stats[player].plays -
        target[player]

      if (difference > 0) {
        score +=
          difference *
          100000000
      }
    })

    // =======================================================
    // ② 残り試合で目標達成できるか
    // =======================================================

    const remainingGames =
      gameCount -
      testSchedule.length

    players.forEach((player) => {
      const need =
        target[player] -
        stats[player].plays

      if (
        need >
        remainingGames
      ) {
        score += 1000000000
      }
    })

    // =======================================================
    // ③ 3連続以上
    //
    // 「発生数の差」を最優先。
    // =======================================================

    const threeCounts =
      players.map(
        (p) =>
          stats[p].threePlus
      )

    const maxThree =
      Math.max(...threeCounts)

    const minThree =
      Math.min(...threeCounts)

    score +=
      (maxThree -
        minThree) *
      250000

    // 3連続そのものも少し抑える
    score +=
      threeCounts.reduce(
        (sum, value) =>
          sum + value,
        0
      ) *
      2500

    // =======================================================
    // ④ 4連続以上
    // =======================================================

    players.forEach((player) => {
      const streak =
        stats[player]
          .maxPlayStreak

      if (streak >= 4) {
        score +=
          (streak - 3) *
          5000000
      }
    })

    // =======================================================
    // ⑤ 今2連続 → 次も出場
    //
    // 3連続になるので少し避ける
    // =======================================================

    candidate.players.forEach(
      (player) => {
        const before =
          currentPlayStreak(
            schedule,
            player
          )

        if (before >= 2) {
          score += 5000
        }
      }
    )

    // =======================================================
    // ⑥ 休憩回数
    //
    // ★9.1では「差」だけを見る。
    // 誰が4回・5回になるかは、
    // 最終段階のランダム選択に任せる。
    // =======================================================

    const restCounts =
      players.map(
        (p) =>
          stats[p].rests
      )

    const maxRest =
      Math.max(...restCounts)

    const minRest =
      Math.min(...restCounts)

    score +=
      (maxRest -
        minRest) *
      10000

    // =======================================================
    // ⑦ 最長休憩
    // =======================================================

    const longestRests =
      players.map(
        (p) =>
          stats[p]
            .maxRestStreak
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
      5000

    // =======================================================
    // ⑧ 5人組
    // =======================================================

    const teamCounts =
      getTeamCounts(
        testSchedule
      )

    const newTeamKey =
      teamKey(
        candidate.players
      )

    const newTeamCount =
      teamCounts[
        newTeamKey
      ] || 0

    if (newTeamCount >= 3) {
      score +=
        (newTeamCount - 2) *
        30000
    }

    if (newTeamCount >= 4) {
      score +=
        (newTeamCount - 3) *
        100000
    }

    // =======================================================
    // ⑨ 直前と完全に同じチーム
    // =======================================================

    if (schedule.length > 0) {
      const previous =
        schedule[
          schedule.length - 1
        ]

      if (
        teamKey(
          previous.players
        ) === newTeamKey
      ) {
        score += 50000
      }
    }

    // =======================================================
    // ⑩ 2人組の偏り
    // =======================================================

    const pairCounts =
      getPairCounts(
        testSchedule
      )

    candidate.players.forEach(
      (a, i) => {
        for (
          let j = i + 1;
          j <
          candidate.players.length;
          j++
        ) {
          const b =
            candidate.players[j]

          const count =
            pairCounts[
              pairKey(a, b)
            ] || 0

          if (count >= 4) {
            score +=
              (count - 3) *
              300
          }
        }
      }
    )

    // =======================================================
    // ★9.1 ランダム性
    //
    // 完全ランダムではなく、
    // 良い候補同士に小さな揺らぎを入れる。
    // =======================================================

    score +=
      Math.random() * 1000

    return score
  }

  // =========================================================
  // 1パターン生成
  // =========================================================

  const generateOne = (
    target: Record<string, number>
  ) => {
    const schedule: Game[] = []

    for (
      let gameIndex = 0;
      gameIndex < gameCount;
      gameIndex++
    ) {
      const restPairs =
        getRestPairs()

      let bestCandidate:
        Game | null = null

      let bestScore =
        Infinity

      for (
        const [restA, restB]
        of restPairs
      ) {
        const team =
          players.filter(
            (player) =>
              player !==
                restA &&
              player !==
                restB
          )

        if (
          team.length !==
          TEAM_SIZE
        ) {
          continue
        }

        const candidate: Game = {
          gameNumber:
            gameIndex + 1,
          players: team,
        }

        const score =
          evaluateCandidate(
            schedule,
            candidate,
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

  const finalScore = (
    schedule: Game[],
    target: Record<string, number>
  ) => {
    const stats =
      calculateStats(schedule)

    let score = 0

    // =======================================================
    // ① 出場回数
    // =======================================================

    const playCounts =
      players.map(
        (p) =>
          stats[p].plays
      )

    const maxPlay =
      Math.max(...playCounts)

    const minPlay =
      Math.min(...playCounts)

    // 最重要
    score +=
      (maxPlay -
        minPlay) *
      100000000

    players.forEach((player) => {
      score +=
        Math.abs(
          stats[player].plays -
            target[player]
        ) *
        100000000
    })

    // =======================================================
    // ② 3連続以上
    // =======================================================

    const threeCounts =
      players.map(
        (p) =>
          stats[p].threePlus
      )

    const maxThree =
      Math.max(...threeCounts)

    const minThree =
      Math.min(...threeCounts)

    // 差をかなり強く評価
    score +=
      (maxThree -
        minThree) *
      3000000

    // 平均からの偏り
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
    // ③ 4連続以上
    // =======================================================

    players.forEach((player) => {
      const streak =
        stats[player]
          .maxPlayStreak

      if (streak >= 4) {
        score +=
          (streak - 3) *
          10000000
      }
    })

    // =======================================================
    // ④ 休憩回数
    //
    // 差は最小化するが、
    // 「誰が少ないか」は評価しない。
    //
    // ★これが9.1の重要ポイント。
    // =======================================================

    const restCounts =
      players.map(
        (p) =>
          stats[p].rests
      )

    const maxRest =
      Math.max(...restCounts)

    const minRest =
      Math.min(...restCounts)

    score +=
      (maxRest -
        minRest) *
      500000

    // =======================================================
    // ⑤ 最長休憩
    // =======================================================

    const longestRests =
      players.map(
        (p) =>
          stats[p]
            .maxRestStreak
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
      30000

    // =======================================================
    // ⑥ 5人組
    // =======================================================

    const teamCounts =
      getTeamCounts(
        schedule
      )

    Object.values(
      teamCounts
    ).forEach((count) => {
      if (count >= 3) {
        score +=
          (count - 2) *
          200000
      }

      if (count >= 4) {
        score +=
          (count - 3) *
          500000
      }
    })

    return score
  }

  // =========================================================
  // ★9.1
  //
  // 「最良の1個」を選ばない。
  //
  // 良い候補を複数残して、
  // その中からランダムに選ぶ。
  //
  // これによって
  //
  // 4,4,4,5,5,5,5
  //
  // のような公平性を維持しながら
  //
  // 4,5,4,4,5,5,5
  //
  // 4,5,5,4,5,4,5
  //
  // など、誰が4回側になるかが
  // 毎回変わる。
  // =========================================================

  const createGames = () => {
    if (
      players.length <
      TEAM_SIZE
    ) {
      alert(
        '参加者は5人以上必要です'
      )
      return
    }

    if (
      gameCount < 1
    ) {
      alert(
        '試合数を1以上にしてください'
      )
      return
    }

    setIsGenerating(true)

    setTimeout(() => {
      let globalBest:
        Game[] | null = null

      let globalBestScore =
        Infinity

      // -----------------------------------------------------
      // ★目標出場回数自体を複数パターン試す
      //
      // 7人16試合なら
      //
      // 12回になる3人
      //
      // を毎回変える。
      // -----------------------------------------------------

      const targetAttempts =
        players.length <= 7
          ? 12
          : players.length <= 9
          ? 8
          : 5

      for (
        let targetTry = 0;
        targetTry <
        targetAttempts;
        targetTry++
      ) {
        const target =
          getTargetPlays()

        // ---------------------------------------------------
        // 1つの目標に対して
        // 複数スケジュールを作る
        // ---------------------------------------------------

        const attempts =
          players.length <= 7
            ? 12
            : players.length <= 9
            ? 6
            : 3

        for (
          let i = 0;
          i < attempts;
          i++
        ) {
          const result =
            generateOne(
              target
            )

          if (!result) {
            continue
          }

          const score =
            finalScore(
              result,
              target
            )

          // -------------------------------------------------
          // ★ほぼ同点ならランダムに採用
          //
          // これにより「いつも同じ人」が
          // 選ばれ続けることを防ぐ。
          // -------------------------------------------------

          const tolerance =
            50000

          if (
            score <
            globalBestScore -
              tolerance
          ) {
            globalBestScore =
              score

            globalBest =
              result
          } else if (
            Math.abs(
              score -
                globalBestScore
            ) <=
            tolerance
          ) {
            if (
              Math.random() <
              0.35
            ) {
              globalBestScore =
                score

              globalBest =
                result
            }
          }
        }
      }

      if (globalBest) {
        setGames(globalBest)
      }

      setIsGenerating(false)
    }, 20)
  }

  // =========================================================
  // 表示用
  // =========================================================

  const stats =
    calculateStats(games)

  const teamCounts =
    getTeamCounts(games)

  const duplicateTeams =
    Object.entries(
      teamCounts
    )
      .filter(
        ([, count]) =>
          count >= 2
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )

  // =========================================================
  // 表示上の連続出場
  // =========================================================

  const getStreak = (
    player: string,
    index: number
  ) => {
    let streak = 0

    for (
      let i = index;
      i >= 0;
      i--
    ) {
      if (
        games[i].players.includes(
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
  // JSX
  // =========================================================

  return (
    <div className="app">

      <h1>
        🏀 バスケ
        メンバー決定
      </h1>

      {/* =============================================== */}
      {/* 参加者 */}
      {/* =============================================== */}

      <section className="card">
        <h2>
          参加者登録
        </h2>

        <div className="input-area">

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key ===
                'Enter'
              ) {
                addPlayer()
              }
            }}
            placeholder="参加者の名前"
          />

          <button
            onClick={
              addPlayer
            }
          >
            追加
          </button>

        </div>

        <p>
          参加者：
          <strong>
            {
              players.length
            }
          </strong>
          人
        </p>

        <ul className="player-list">

          {players.map(
            (
              player,
              index
            ) => (
              <li
                key={
                  player
                }
              >

                <span>
                  {player}
                </span>

                <button
                  onClick={() =>
                    removePlayer(
                      index
                    )
                  }
                >
                  削除
                </button>

              </li>
            )
          )}

        </ul>
      </section>

      {/* =============================================== */}
      {/* 試合設定 */}
      {/* =============================================== */}

      <section className="card">

        <h2>
          試合設定
        </h2>

        <label>
          試合数：
          <input
            type="number"
            min="1"
            value={
              gameCount
            }
            onChange={(e) =>
              setGameCount(
                Math.max(
                  1,
                  Number(
                    e.target
                      .value
                  )
                )
              )
            }
          />
        </label>

        <br />

        <button
          className="main-button"
          onClick={
            createGames
          }
          disabled={
            isGenerating
          }
        >
          {isGenerating
            ? '計算中...'
            : 'メンバーを作成'}
        </button>

        {isGenerating && (
          <p>
            公平性を維持しながら、
            複数パターンを
            比較しています…
          </p>
        )}

      </section>

      {/* =============================================== */}
      {/* 結果 */}
      {/* =============================================== */}

      {games.length > 0 && (
        <>

          <section className="card">

            <h2>
              📊 出場状況
            </h2>

            <div className="legend">

              <span>
                ○ 出場
              </span>

              <span>
                × 休憩
              </span>

              <span>
                ③ 3連続
              </span>

              <span>
                ④ 4連続以上
              </span>

            </div>

            <div className="table-wrapper">

              <table className="attendance-table">

                <thead>

                  <tr>

                    <th>
                      参加者
                    </th>

                    {games.map(
                      (game) => (
                        <th
                          key={
                            game.gameNumber
                          }
                        >
                          試
                          {
                            game.gameNumber
                          }
                        </th>
                      )
                    )}

                    <th>
                      出場
                    </th>

                    <th>
                      休憩
                    </th>

                    <th>
                      最長出場
                    </th>

                    <th>
                      最長休憩
                    </th>

                    <th>
                      3連続以上
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {players.map(
                    (player) => {

                      const s =
                        stats[
                          player
                        ]

                      return (
                        <tr
                          key={
                            player
                          }
                        >

                          <td>
                            <strong>
                              {
                                player
                              }
                            </strong>
                          </td>

                          {games.map(
                            (
                              game,
                              index
                            ) => {

                              const playing =
                                game.players.includes(
                                  player
                                )

                              const streak =
                                playing
                                  ? getStreak(
                                      player,
                                      index
                                    )
                                  : 0

                              let className =
                                playing
                                  ? 'playing'
                                  : 'resting'

                              if (
                                playing &&
                                streak ===
                                  3
                              ) {
                                className =
                                  'streak-three'
                              }

                              if (
                                playing &&
                                streak >=
                                  4
                              ) {
                                className =
                                  'streak-four'
                              }

                              return (
                                <td
                                  key={
                                    game.gameNumber
                                  }
                                  className={
                                    className
                                  }
                                >
                                  {playing
                                    ? streak >=
                                      4
                                      ? '④'
                                      : streak ===
                                        3
                                      ? '③'
                                      : '○'
                                    : '×'}
                                </td>
                              )
                            }
                          )}

                          <td>
                            {
                              s.plays
                            }
                          </td>

                          <td>
                            {
                              s.rests
                            }
                          </td>

                          <td>
                            {
                              s.maxPlayStreak
                            }
                          </td>

                          <td>
                            {
                              s.maxRestStreak
                            }
                          </td>

                          <td>
                            {
                              s.threePlus
                            }
                          </td>

                        </tr>
                      )
                    }
                  )}

                </tbody>

              </table>

            </div>

            <div className="explanation">

              <p>
                <strong>
                  ③
                </strong>
                ：3試合連続出場
              </p>

              <p>
                <strong>
                  ④
                </strong>
                ：4試合以上連続出場
              </p>

              <p>
                3連続出場は完全禁止ではなく、
                <strong>
                  3連続になった回数が
                  なるべく均等
                </strong>
                になるようにしています。
              </p>

              <p>
                また、
                <strong>
                  出場回数の差を最優先
                </strong>
                しています。
              </p>

              <p>
                <strong>
                  同程度に公平なパターンは
                  毎回ランダムに変化します。
                </strong>
              </p>

            </div>

          </section>

          {/* =========================================== */}
          {/* 試合メンバー */}
          {/* =========================================== */}

          <section className="card">

            <h2>
              🏀 試合メンバー
            </h2>

            <div className="game-list">

              {games.map(
                (game) => (
                  <div
                    className="game-item"
                    key={
                      game.gameNumber
                    }
                  >

                    <div className="game-number">
                      試
                      {
                        game.gameNumber
                      }
                    </div>

                    <div className="game-players">

                      {game.players.map(
                        (player) => (
                          <span
                            className="player-chip"
                            key={
                              player
                            }
                          >
                            {
                              player
                            }
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </section>

          {/* =========================================== */}
          {/* 5人組 */}
          {/* =========================================== */}

          <section className="card">

            <h2>
              👥 5人組の重複
            </h2>

            {duplicateTeams.length ===
            0 ? (

              <p>
                ✓ 同じ5人組はありません
              </p>

            ) : (

              <>

                <p>
                  同じ5人組が
                  {
                    duplicateTeams.length
                  }
                  種類あります。
                </p>

                <p>
                  2回程度の重複は許容し、
                  3回以上の極端な重複を
                  できるだけ避けています。
                </p>

                <div>

                  {duplicateTeams.map(
                    ([
                      team,
                      count,
                    ]) => (
                      <div
                        key={
                          team
                        }
                      >

                        <strong>
                          {team
                            .split(
                              '|'
                            )
                            .join(
                              '・'
                            )}
                        </strong>
                        ：
                        {count}
                        回

                      </div>
                    )
                  )}

                </div>

              </>
            )}

          </section>

        </>
      )}

    </div>
  )
}

export default App

    // ====================================
    // 最後の試合まで出場していた場合
    // ====================================

    if (playStreak >= 3) {
      result[player].threePlus++
    }
  })

  return result
}
  // =========================================================
  // 5人組
  // =========================================================

  const getTeamCounts = (
    schedule: Game[]
  ) => {
    const counts: Record<string, number> = {}

    schedule.forEach((game) => {
      const key =
        teamKey(game.players)

      counts[key] =
        (counts[key] || 0) + 1
    })

    return counts
  }

  // =========================================================
  // 2人組
  // =========================================================

  const getPairCounts = (
    schedule: Game[]
  ) => {
    const counts: Record<string, number> = {}

    schedule.forEach((game) => {
      for (
        let i = 0;
        i < game.players.length;
        i++
      ) {
        for (
          let j = i + 1;
          j < game.players.length;
          j++
        ) {
          const key = pairKey(
            game.players[i],
            game.players[j]
          )

          counts[key] =
            (counts[key] || 0) + 1
        }
      }
    })

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
      let i = schedule.length - 1;
      i >= 0;
      i--
    ) {
      if (
        schedule[i].players.includes(
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
  // これから残っている試合で
  // 目標出場回数を達成可能か確認
  // =========================================================

  const isFeasible = (
    schedule: Game[],
    target: Record<string, number>
  ) => {
    const stats =
      calculateStats(schedule)

    const remainingGames =
      gameCount - schedule.length

    for (const player of players) {
      const current =
        stats[player].plays

      const remainingNeeded =
        target[player] - current

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
  // 次の試合で「休む2人」の候補を作る
  //
  // 7人なら21通り。
  // 全候補を調べるので非常に軽い。
  // =========================================================

  const getRestPairs = () => {
    const result: [string, string][] = []

    for (
      let i = 0;
      i < players.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < players.length;
        j++
      ) {
        result.push([
          players[i],
          players[j],
        ])
      }
    }

    return result
  }

  // =========================================================
  // 候補1つの評価
  //
  // 重要度：
  //
  // 1. 目標出場回数から外れない
  // 2. 3連続以上を偏らせない
  // 3. 4連続以上を強く避ける
  // 4. 休憩を均等化
  // 5. 5人組重複
  // =========================================================

  const evaluateCandidate = (
    schedule: Game[],
    candidate: Game,
    target: Record<string, number>
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

    // -------------------------------------------------------
    // 出場回数
    // -------------------------------------------------------

    players.forEach((player) => {
      const difference =
        stats[player].plays -
        target[player]

      if (difference > 0) {
        score +=
          difference *
          100000000
      }
    })

    // -------------------------------------------------------
    // 途中時点で出場が遅れすぎている人
    // -------------------------------------------------------

    const remainingGames =
      gameCount -
      testSchedule.length

    players.forEach((player) => {
      const need =
        target[player] -
        stats[player].plays

      if (
        need >
        remainingGames
      ) {
        score +=
          1000000000
      }
    })

    // -------------------------------------------------------
    // 3連続以上
    //
    // 「禁止」ではない。
    // ただし同じ人に集中するのを強く避ける。
    // -------------------------------------------------------

    const threeCounts =
      players.map(
        (p) =>
          stats[p].threePlus
      )

    const maxThree =
      Math.max(...threeCounts)

    const minThree =
      Math.min(...threeCounts)

    score +=
      (maxThree -
        minThree) *
      150000

    // 3連続そのものも少しペナルティ
    players.forEach((player) => {
      score +=
        stats[player]
          .threePlus *
        3000
    })

    // -------------------------------------------------------
    // 4連続以上
    // -------------------------------------------------------

    players.forEach((player) => {
      const streak =
        stats[player]
          .maxPlayStreak

      if (streak >= 4) {
        score +=
          (streak - 3) *
          500000
      }
    })

    // -------------------------------------------------------
    // 現在2連続で次も出場する
    // → 3連続になるので少し避ける
    // -------------------------------------------------------

    candidate.players.forEach(
      (player) => {
        const before =
          currentPlayStreak(
            schedule,
            player
          )

        if (before >= 2) {
          score += 5000
        }
      }
    )

    // -------------------------------------------------------
    // 休憩回数の均等
    // -------------------------------------------------------

    const restCounts =
      players.map(
        (p) =>
          stats[p].rests
      )

    const maxRest =
      Math.max(...restCounts)

    const minRest =
      Math.min(...restCounts)

    score +=
      (maxRest -
        minRest) *
      3000

    // -------------------------------------------------------
    // 最長休憩
    // -------------------------------------------------------

    const maxRestStreaks =
      players.map(
        (p) =>
          stats[p]
            .maxRestStreak
      )

    const longestRest =
      Math.max(
        ...maxRestStreaks
      )

    const shortestLongestRest =
      Math.min(
        ...maxRestStreaks
      )

    score +=
      (longestRest -
        shortestLongestRest) *
      3000

    // -------------------------------------------------------
    // 5人組
    // -------------------------------------------------------

    const teamCounts =
      getTeamCounts(
        testSchedule
      )

    const newTeamKey =
      teamKey(
        candidate.players
      )

    const newTeamCount =
      teamCounts[
        newTeamKey
      ] || 0

    // 2回まではかなり軽い
    if (newTeamCount >= 3) {
      score +=
        (newTeamCount - 2) *
        30000
    }

    if (newTeamCount >= 4) {
      score +=
        (newTeamCount - 3) *
        100000
    }

    // -------------------------------------------------------
    // 直前試合との同じ5人
    // -------------------------------------------------------

    if (
      schedule.length > 0
    ) {
      const previous =
        schedule[
          schedule.length - 1
        ]

      const previousKey =
        teamKey(
          previous.players
        )

      if (
        previousKey ===
        newTeamKey
      ) {
        score += 20000
      }
    }

    // -------------------------------------------------------
    // 2人組の偏り
    // -------------------------------------------------------

    const pairCounts =
      getPairCounts(
        testSchedule
      )

    candidate.players.forEach(
      (a, i) => {
        for (
          let j = i + 1;
          j <
          candidate.players.length;
          j++
        ) {
          const b =
            candidate.players[j]

          const count =
            pairCounts[
              pairKey(a, b)
            ] || 0

          if (count >= 4) {
            score +=
              (count - 3) *
              200
          }
        }
      }
    )

    // -------------------------------------------------------
    // 完全なランダムではなく、
    // 同点付近を少しランダム化
    // -------------------------------------------------------

    score +=
      Math.random() * 50

    return score
  }

  // =========================================================
  // 1つのスケジュールを作る
  // =========================================================

  const generateOne = (
    target: Record<string, number>
  ) => {
    const schedule: Game[] = []

    const restPairs =
      getRestPairs()

    for (
      let gameIndex = 0;
      gameIndex < gameCount;
      gameIndex++
    ) {
      let bestCandidate:
        Game | null = null

      let bestScore =
        Infinity

      // -----------------------------------------------------
      // 休む2人の全候補を評価
      // -----------------------------------------------------

      for (
        const [restA, restB]
        of restPairs
      ) {
        const team =
          players.filter(
            (player) =>
              player !==
                restA &&
              player !==
                restB
          )

        if (
          team.length !==
          TEAM_SIZE
        ) {
          continue
        }

        const candidate: Game = {
          gameNumber:
            gameIndex + 1,
          players: team,
        }

        const score =
          evaluateCandidate(
            schedule,
            candidate,
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
  //
  // ここでは「全体」を評価する。
  // =========================================================

  const finalScore = (
    schedule: Game[],
    target: Record<string, number>
  ) => {
    const stats =
      calculateStats(schedule)

    let score = 0

    // -------------------------------------------------------
    // 出場回数
    //
    // ここが最重要。
    // -------------------------------------------------------

    const playCounts =
      players.map(
        (p) =>
          stats[p].plays
      )

    const maxPlay =
      Math.max(...playCounts)

    const minPlay =
      Math.min(...playCounts)

    score +=
      (maxPlay -
        minPlay) *
      100000000

    players.forEach((player) => {
      const diff =
        Math.abs(
          stats[player].plays -
            target[player]
        )

      score +=
        diff *
        100000000
    })

    // -------------------------------------------------------
    // 3連続回数
    // -------------------------------------------------------

    const threeCounts =
      players.map(
        (p) =>
          stats[p].threePlus
      )

    const maxThree =
      Math.max(...threeCounts)

    const minThree =
      Math.min(...threeCounts)

    score +=
      (maxThree -
        minThree) *
      1000000

    // 平均からのズレ
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
          50000
      }
    )

    // -------------------------------------------------------
    // 4連続以上
    // -------------------------------------------------------

    players.forEach((player) => {
      const streak =
        stats[player]
          .maxPlayStreak

      if (streak >= 4) {
        score +=
          (streak - 3) *
          10000000
      }
    })

    // -------------------------------------------------------
    // 休憩
    // -------------------------------------------------------

    const restCounts =
      players.map(
        (p) =>
          stats[p].rests
      )

    score +=
      (Math.max(
        ...restCounts
      ) -
        Math.min(
          ...restCounts
        )) *
      100000

    // -------------------------------------------------------
    // 最長休憩
    // -------------------------------------------------------

    const longestRests =
      players.map(
        (p) =>
          stats[p]
            .maxRestStreak
      )

    score +=
      (Math.max(
        ...longestRests
      ) -
        Math.min(
          ...longestRests
        )) *
      30000

    // -------------------------------------------------------
    // 5人組
    // -------------------------------------------------------

    const teamCounts =
      getTeamCounts(
        schedule
      )

    Object.values(
      teamCounts
    ).forEach((count) => {
      if (count >= 3) {
        score +=
          (count - 2) *
          200000
      }

      if (count >= 4) {
        score +=
          (count - 3) *
          500000
      }
    })

    return score
  }

  // =========================================================
  // 生成
  // =========================================================

  const createGames = () => {
    if (
      players.length <
      TEAM_SIZE
    ) {
      alert(
        '参加者は5人以上必要です'
      )
      return
    }

    if (
      gameCount <
      1
    ) {
      alert(
        '試合数を1以上にしてください'
      )
      return
    }

    setIsGenerating(true)

    setTimeout(() => {
      const target =
        getTargetPlays()

      let best:
        Game[] | null = null

      let bestScore =
        Infinity

      // -----------------------------------------------------
      // 複数パターンを作る
      //
      // ただし重い総当たりではない。
      // 各試合は最大21候補程度。
      // -----------------------------------------------------

      const attempts =
        players.length <= 7
          ? 20
          : players.length <= 9
          ? 10
          : 5

      for (
        let i = 0;
        i < attempts;
        i++
      ) {
        const result =
          generateOne(
            target
          )

        if (!result) {
          continue
        }

        const score =
          finalScore(
            result,
            target
          )

        if (
          score <
          bestScore
        ) {
          bestScore =
            score

          best =
            result
        }
      }

      if (best) {
        setGames(best)
      }

      setIsGenerating(false)
    }, 20)
  }

  // =========================================================
  // 表示用
  // =========================================================

  const stats =
    calculateStats(games)

  const teamCounts =
    getTeamCounts(games)

  const duplicateTeams =
    Object.entries(
      teamCounts
    )
      .filter(
        ([, count]) =>
          count >= 2
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )

  // =========================================================
  // 現在の出場連続数
  // =========================================================

  const getStreak = (
    player: string,
    index: number
  ) => {
    let streak = 0

    for (
      let i = index;
      i >= 0;
      i--
    ) {
      if (
        games[i].players.includes(
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
  // JSX
  // =========================================================

  return (
    <div className="app">
      <h1>
        🏀 バスケ
        メンバー決定
      </h1>

      {/* =============================================== */}
      {/* 参加者 */}
      {/* =============================================== */}

      <section className="card">
        <h2>
          参加者登録
        </h2>

        <div className="input-area">
          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key ===
                'Enter'
              ) {
                addPlayer()
              }
            }}
            placeholder="参加者の名前"
          />

          <button
            onClick={
              addPlayer
            }
          >
            追加
          </button>
        </div>

        <p>
          参加者：
          <strong>
            {
              players.length
            }
          </strong>
          人
        </p>

        <ul className="player-list">
          {players.map(
            (
              player,
              index
            ) => (
              <li
                key={
                  player
                }
              >
                <span>
                  {player}
                </span>

                <button
                  onClick={() =>
                    removePlayer(
                      index
                    )
                  }
                >
                  削除
                </button>
              </li>
            )
          )}
        </ul>
      </section>

      {/* =============================================== */}
      {/* 設定 */}
      {/* =============================================== */}

      <section className="card">
        <h2>
          試合設定
        </h2>

        <label>
          試合数：
          <input
            type="number"
            min="1"
            value={
              gameCount
            }
            onChange={(e) =>
              setGameCount(
                Math.max(
                  1,
                  Number(
                    e.target
                      .value
                  )
                )
              )
            }
          />
        </label>

        <br />

        <button
          className="main-button"
          onClick={
            createGames
          }
          disabled={
            isGenerating
          }
        >
          {isGenerating
            ? '計算中...'
            : 'メンバーを作成'}
        </button>

        {isGenerating && (
          <p>
            公平性を重視して
            組み合わせを
            計算しています…
          </p>
        )}
      </section>

      {/* =============================================== */}
      {/* 結果 */}
      {/* =============================================== */}

      {games.length > 0 && (
        <>
          <section className="card">
            <h2>
              📊 出場状況
            </h2>

            <div className="legend">
              <span>
                ○ 出場
              </span>

              <span>
                × 休憩
              </span>

              <span>
                ③ 3連続
              </span>

              <span>
                ④ 4連続以上
              </span>
            </div>

            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>
                      参加者
                    </th>

                    {games.map(
                      (game) => (
                        <th
                          key={
                            game.gameNumber
                          }
                        >
                          試
                          {
                            game.gameNumber
                          }
                        </th>
                      )
                    )}

                    <th>
                      出場
                    </th>

                    <th>
                      休憩
                    </th>

                    <th>
                      最長出場
                    </th>

                    <th>
                      最長休憩
                    </th>

                    <th>
                      3連続以上
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {players.map(
                    (player) => {
                      const s =
                        stats[
                          player
                        ]

                      return (
                        <tr
                          key={
                            player
                          }
                        >
                          <td>
                            <strong>
                              {
                                player
                              }
                            </strong>
                          </td>

                          {games.map(
                            (
                              game,
                              index
                            ) => {
                              const playing =
                                game.players.includes(
                                  player
                                )

                              const streak =
                                playing
                                  ? getStreak(
                                      player,
                                      index
                                    )
                                  : 0

                              let className =
                                playing
                                  ? 'playing'
                                  : 'resting'

                              if (
                                playing &&
                                streak ===
                                  3
                              ) {
                                className =
                                  'streak-three'
                              }

                              if (
                                playing &&
                                streak >=
                                  4
                              ) {
                                className =
                                  'streak-four'
                              }

                              return (
                                <td
                                  key={
                                    game.gameNumber
                                  }
                                  className={
                                    className
                                  }
                                >
                                  {playing
  ? streak >= 4
    ? '④'
    : streak === 3
    ? '③'
    : '○'
  : '×'}
                                </td>
                              )
                            }
                          )}

                          <td>
                            {
                              s.plays
                            }
                          </td>

                          <td>
                            {
                              s.rests
                            }
                          </td>

                          <td>
                            {
                              s.maxPlayStreak
                            }
                          </td>

                          <td>
                            {
                              s.maxRestStreak
                            }
                          </td>

                          <td>
                            {
                              s.threePlus
                            }
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="explanation">
              <p>
                <strong>
                  ③
                </strong>
                ：3試合連続出場
              </p>

              <p>
                <strong>
                  ④
                </strong>
                ：4試合以上連続出場
              </p>

              <p>
                3連続出場は完全禁止ではなく、
                <strong>
                  3連続になった回数が
                  なるべく均等
                </strong>
                になるようにしています。
              </p>

              <p>
                また、
                <strong>
                  出場回数の差を最優先
                </strong>
                しています。
              </p>
            </div>
          </section>

          {/* =========================================== */}
          {/* 試合メンバー */}
          {/* =========================================== */}

          <section className="card">
            <h2>
              🏀 試合メンバー
            </h2>

            <div className="game-list">
              {games.map(
                (game) => (
                  <div
                    className="game-item"
                    key={
                      game.gameNumber
                    }
                  >
                    <div className="game-number">
                      試
                      {
                        game.gameNumber
                      }
                    </div>

                    <div className="game-players">
                      {game.players.map(
                        (
                          player
                        ) => (
                          <span
                            className="player-chip"
                            key={
                              player
                            }
                          >
                            {
                              player
                            }
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* =========================================== */}
          {/* 5人組 */}
          {/* =========================================== */}

          <section className="card">
            <h2>
              👥 5人組の重複
            </h2>

            {duplicateTeams.length ===
            0 ? (
              <p>
                ✓ 同じ5人組はありません
              </p>
            ) : (
              <>
                <p>
                  同じ5人組が
                  {
                    duplicateTeams.length
                  }
                  種類あります。
                </p>

                <p>
                  2回程度の重複は許容し、
                  3回以上の極端な重複を
                  できるだけ避けています。
                </p>

                <div>
                  {duplicateTeams.map(
                    ([
                      team,
                      count,
                    ]) => (
                      <div
                        key={
                          team
                        }
                      >
                        <strong>
                          {team
                            .split(
                              '|'
                            )
                            .join(
                              '・'
                            )}
                        </strong>
                        ：
                        {count}
                        回
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default App