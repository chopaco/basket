import { useEffect, useState } from 'react'
import './App.css'

type Game = {
  gameNumber: number
  players: string[]
}

type Position = 'G' | 'F' | 'C' | ''

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


type ShareData = {
  players: string[]
  games: Game[]
  usePositions: boolean
  positions: Record<
    string,
    Position
  >
}

type Stats = {
  plays: number
  rests: number
  maxPlayStreak: number
  maxRestStreak: number
  threePlus: number
}

type History = {
  id: string
  createdAt: string
  players: string[]
  gameCount: number
  games: Game[]
  usePositions: boolean
  positions: Record<string, Position>
}

const TEAM_SIZE = 5
const MIN_PLAYERS = 6
const MAX_PLAYERS = 12
const MIN_GAMES = 1
const MAX_GAMES = 16
const MAX_HISTORY = 3

const PLAYERS_STORAGE_KEY = 'team-maker-players'
const GAME_COUNT_STORAGE_KEY = 'team-maker-game-count'
const CURRENT_GAMES_STORAGE_KEY = 'team-maker-current-games'
const HISTORY_STORAGE_KEY = 'team-maker-history'
const POSITIONS_STORAGE_KEY =
  'team-maker-positions'
const USE_POSITIONS_STORAGE_KEY =
  'team-maker-use-positions'

// =========================================================
// localStorage
// =========================================================

const loadSavedPlayers = (): string[] => {
  try {
    const saved = localStorage.getItem(PLAYERS_STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const loadSavedPositions = (): Record<
  string,
  Position
> => {
  try {
    const saved =
      localStorage.getItem(
        POSITIONS_STORAGE_KEY
      )

    if (!saved) return {}

    const parsed =
      JSON.parse(saved)

    if (
      typeof parsed !==
        'object' ||
      parsed === null
    ) {
      return {}
    }

    return parsed
  } catch {
    return {}
  }
}

const loadSavedUsePositions = () => {
  try {
    const saved =
      localStorage.getItem(
        USE_POSITIONS_STORAGE_KEY
      )

    return saved === 'true'
  } catch {
    return false
  }
}

const loadSavedGameCount = () => {
  try {
    const saved = localStorage.getItem(GAME_COUNT_STORAGE_KEY)
    const parsed = Number(saved)

    return Number.isFinite(parsed)
      ? Math.min(
          MAX_GAMES,
          Math.max(
            MIN_GAMES,
            Math.trunc(parsed)
          )
        )
      : MAX_GAMES
  } catch {
    return 16
  }
}

const loadSavedGames = (): Game[] => {
  try {
    const saved = localStorage.getItem(
      CURRENT_GAMES_STORAGE_KEY
    )

    if (!saved) return []

    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const loadSavedHistory = (): History[] => {
  try {
    const saved = localStorage.getItem(
      HISTORY_STORAGE_KEY
    )

    if (!saved) return []

    const parsed = JSON.parse(saved)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

const loadSharedData = (): ShareData | null => {
  try {
    const prefix = '#result='

    if (
      !window.location.hash.startsWith(
        prefix
      )
    ) {
      return null
    }

    const encoded =
      window.location.hash.slice(
        prefix.length
      )

    const parsed = JSON.parse(
      decodeURIComponent(encoded)
    ) as Partial<ShareData>

    if (
      !Array.isArray(parsed.players) ||
      !Array.isArray(parsed.games)
    ) {
      return null
    }

    return {
      players: parsed.players,
      games: parsed.games,
      usePositions:
        parsed.usePositions === true,
      positions:
        parsed.positions &&
        typeof parsed.positions === 'object'
          ? parsed.positions
          : {},
    }
  } catch {
    alert(
      '共有された結果を読み込めませんでした'
    )
    return null
  }
}


function App() {
  const [sharedData] =
    useState(loadSharedData)

  const [name, setName] =
    useState('')

  const [inputError, setInputError] =
    useState('')

  const [editingPlayer, setEditingPlayer] =
    useState<string | null>(null)

  const [editingName, setEditingName] =
    useState('')

  const [editError, setEditError] =
    useState('')

  const [resultView, setResultView] =
    useState<'games' | 'summary'>('games')

const [
  usePositions,
  setUsePositions,
] = useState(
  () =>
    sharedData?.usePositions ??
    loadSavedUsePositions()
)

const [position, setPosition] =
  useState<Position>('')

const [positions, setPositions] =
  useState<
    Record<string, Position>
  >(
    () =>
      sharedData?.positions ??
      loadSavedPositions()
  )
  const [players, setPlayers] =
    useState<string[]>(
      () =>
        sharedData?.players ??
        loadSavedPlayers()
    )

  const [gameCount, setGameCount] =
    useState<number>(
      () =>
        sharedData
          ? Math.min(
              MAX_GAMES,
              Math.max(
                MIN_GAMES,
                sharedData.games.length
              )
            )
          : loadSavedGameCount()
    )

  const [games, setGames] =
    useState<Game[]>(
      () =>
        sharedData?.games ??
        loadSavedGames()
    )

  const [history, setHistory] =
    useState<History[]>(
      loadSavedHistory
    )


  const [isGenerating, setIsGenerating] =
    useState(false)

  useEffect(() => {
    if (!isGenerating) return

    const previousOverflow =
      document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isGenerating])

useEffect(() => {
  try {
    localStorage.setItem(
      POSITIONS_STORAGE_KEY,
      JSON.stringify(positions)
    )
  } catch {
    // 保存できなくても続行
  }
}, [positions])

useEffect(() => {
  try {
    localStorage.setItem(
      USE_POSITIONS_STORAGE_KEY,
      String(usePositions)
    )
  } catch {
    // 保存できなくても続行
  }
}, [usePositions])

  // =========================================================
  // 自動保存
  // =========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        PLAYERS_STORAGE_KEY,
        JSON.stringify(players)
      )
    } catch {
      // 保存できなくても続行
    }
  }, [players])

  useEffect(() => {
    try {
      localStorage.setItem(
        GAME_COUNT_STORAGE_KEY,
        String(gameCount)
      )
    } catch {
      // 保存できなくても続行
    }
  }, [gameCount])

  useEffect(() => {
    try {
      localStorage.setItem(
        CURRENT_GAMES_STORAGE_KEY,
        JSON.stringify(games)
      )
    } catch {
      // 保存できなくても続行
    }
  }, [games])

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(history)
      )
    } catch {
      // 保存できなくても続行
    }
  }, [history])

  // =========================================================
  // 基本
  // =========================================================

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
  // 参加者
  // =========================================================

  const addPlayer = () => {
    const value = name.trim()

    if (!value) {
      setInputError(
        '参加者名を入力してください'
      )
      return
    }

    if (
      usePositions &&
      !position
    ) {
      setInputError(
        'ポジションを選択してください'
      )
      return
    }

    if (players.includes(value)) {
      setInputError(
        '同じ名前が登録されています'
      )
      return
    }

    if (players.length >= MAX_PLAYERS) {
      setInputError(
        `参加者は最大${MAX_PLAYERS}人までです`
      )
      return
    }

setPlayers([
  ...players,
  value,
])

if (usePositions) {
  setPositions({
    ...positions,
    [value]: position,
  })
}

setName('')
setPosition('')
setInputError('')
setGames([])
  }

  const startEditingPlayer = (
    player: string
  ) => {
    if (
      editingPlayer &&
      editingPlayer !== player &&
      !saveEditedPlayer()
    ) {
      return
    }

    setEditingPlayer(player)
    setEditingName(player)
    setEditError('')
  }

  const cancelEditingPlayer = () => {
    setEditingPlayer(null)
    setEditingName('')
    setEditError('')
  }

  function saveEditedPlayer(): boolean {
    if (!editingPlayer) {
      return true
    }

    const nextName =
      editingName.trim()

    if (!nextName) {
      setEditError(
        '入力必須です'
      )
      return false
    }

    if (
      nextName !== editingPlayer &&
      players.includes(nextName)
    ) {
      setEditError(
        '重複しています'
      )
      return false
    }

    if (nextName !== editingPlayer) {
      setPlayers(
        (current) =>
          current.map(
            (player) =>
              player === editingPlayer
                ? nextName
                : player
          )
      )

      setPositions(
        (current) => {
          const next = {
            ...current,
          }
          const savedPosition =
            next[editingPlayer]

          delete next[editingPlayer]

          if (savedPosition) {
            next[nextName] = savedPosition
          }

          return next
        }
      )

      setGames(
        (current) =>
          current.map(
            (game) => ({
              ...game,
              players:
                game.players.map(
                  (player) =>
                    player === editingPlayer
                      ? nextName
                      : player
                ),
            })
          )
      )
    }

    cancelEditingPlayer()
    return true
  }

  const removePlayer = (
    index: number
  ) => {
    const playerToRemove =
      players[index]

    setPlayers(
      players.filter(
        (_, i) =>
          i !== index
      )
    )

    setPositions(
      (current) => {
        const next = {
          ...current,
        }

        delete next[playerToRemove]

        return next
      }
    )

    setGames([])
  }

  const clearPlayers = () => {
    if (players.length === 0) {
      return
    }

    if (
      !window.confirm(
        '参加者を全員削除しますか？生成結果も削除されます。'
      )
    ) {
      return
    }

    setPlayers([])
    setPositions({})
    setGames([])
    setName('')
    setPosition('')
  }

  const updatePlayerPosition = (
    player: string,
    nextPosition: Exclude<Position, ''>
  ) => {
    setPositions(
      (current) => ({
        ...current,
        [player]: nextPosition,
      })
    )

    setGames([])
  }

  // =========================================================
  // 履歴
  // =========================================================

  const createHistoryId = () =>
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`

  const saveHistory = (
    generatedGames: Game[]
  ) => {
    const newHistory: History = {
      id: createHistoryId(),

      createdAt:
        new Date().toISOString(),

      players: [
        ...players,
      ],

      gameCount,

      usePositions,

      positions: Object.fromEntries(
        players.map(
          (player) => [
            player,
            positions[player] || '',
          ]
        )
      ),

      games:
        generatedGames.map(
          (game) => ({
            gameNumber:
              game.gameNumber,

            players: [
              ...game.players,
            ],
          })
        ),
    }

    setHistory(
      (prev) =>
        [
          newHistory,
          ...prev,
        ].slice(
          0,
          MAX_HISTORY
        )
    )
  }

  const loadHistory = (
    item: History
  ) => {
    setPlayers([
      ...item.players,
    ])

    setGameCount(
      Math.min(
        MAX_GAMES,
        Math.max(
          MIN_GAMES,
          item.gameCount
        )
      )
    )

    setUsePositions(
      item.usePositions === true
    )

    setPositions(
      item.positions || {}
    )

    setGames(
      item.games.map(
        (game) => ({
          gameNumber:
            game.gameNumber,

          players: [
            ...game.players,
          ],
        })
      )
    )

    // スクロール位置は変更しない
  }

  const deleteHistory = (
    id: string
  ) => {
    setHistory(
      (prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
    )
  }

  const formatHistoryDate = (
    value: string
  ) => {
    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return ''
    }

    return date.toLocaleString(
      'ja-JP',
      {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

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

  // =========================================================
  // メンバー作成
  // =========================================================

  const createGames = () => {
    if (
      players.length <
      MIN_PLAYERS ||
      players.length >
      MAX_PLAYERS
    ) {
      alert(
        `参加者は${MIN_PLAYERS}～${MAX_PLAYERS}人にしてください`
      )

      return
    }

if (
  gameCount < MIN_GAMES ||
  gameCount > MAX_GAMES
) {
  alert(
    `試合数は${MIN_GAMES}～${MAX_GAMES}にしてください`
  )

  return
}

// =========================================================
// ポジション設定チェック
// =========================================================

if (usePositions) {
  const allHavePosition =
    players.every(
      (player) =>
        positions[player] === 'G' ||
        positions[player] === 'F' ||
        positions[player] === 'C'
    )

  if (!allHavePosition) {
    alert(
      'ポジション設定を使う場合は、全員のポジションを登録してください'
    )

    return
  }
}

setIsGenerating(
  true
)

    const runMainThreadFallback = () => {
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

      if (
        globalBest
      ) {
        setGames(
          globalBest
        )

        saveHistory(
          globalBest
        )
      } else {
        alert(
          '条件を満たす組み合わせを作成できませんでした。もう一度生成してください。'
        )
      }

      setIsGenerating(
        false
      )
    }

    try {
      const worker = new Worker(
        new URL(
          './generator.worker.ts',
          import.meta.url
        ),
        { type: 'module' }
      )

      worker.onmessage = (
        event: MessageEvent<{
          type: 'complete' | 'error'
          games?: Game[]
          message?: string
        }>
      ) => {
        if (
          event.data.type === 'complete' &&
          event.data.games
        ) {
          setGames(event.data.games)
          saveHistory(event.data.games)
        } else {
          alert(
            event.data.message ||
              '条件を満たす組み合わせを作成できませんでした。もう一度生成してください。'
          )
        }

        worker.terminate()
        setIsGenerating(false)
      }

      worker.onerror = () => {
        worker.terminate()
        setTimeout(
          runMainThreadFallback,
          20
        )
      }

      worker.postMessage({
        players,
        gameCount,
        usePositions,
        positions,
      })
    } catch {
      setTimeout(
        runMainThreadFallback,
        20
      )
    }
  }

  // =========================================================
  // 表示用
  // =========================================================

  const stats =
    calculateStats(
      games
    )

  const teamCounts =
    getTeamCounts(
      games
    )

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
          b[1] -
          a[1]
      )

  // =========================================================
  // 表示用連続出場
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
        games[
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
// 共有用
// =========================================================

const createShareText = () => {
  const lines = [
    '👶 試合メンバー 👶',
    '',
  ]

  games.forEach((game) => {
    lines.push(
      `試${game.gameNumber}：${game.players.join('・')}`
    )
  })

  return lines.join('\n')
}

const copyResult = async () => {
  const text = createShareText()

  try {
    await navigator.clipboard.writeText(text)
    alert('結果をコピーしました')
  } catch {
    alert('コピーできませんでした')
  }
}

const createShareUrl = () => {
  const data: ShareData = {
    players,
    games,
    usePositions,
    positions,
  }

  const json =
    JSON.stringify(data)

  const encoded =
    encodeURIComponent(json)

  return (
    window.location.origin +
    window.location.pathname +
    '#result=' +
    encoded
  )
}

const shareResult = async () => {
  const url =
    createShareUrl()

  if (navigator.share) {
    try {
      await navigator.share({
        title:
          '🏀 試合メンバー',

        url,
      })
    } catch {
      // 共有をキャンセルした場合は何もしない
    }

    return
  }

  try {
    await navigator.clipboard.writeText(
      url
    )

    alert(
      '共有URLをコピーしました'
    )
  } catch {
    alert(
      '共有できませんでした'
    )
  }
}

  const addPlayerDisabled =
    !name.trim() ||
    (
      usePositions &&
      !position
    )

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div
      className="app"
      aria-busy={isGenerating}
    >

      {isGenerating && (
        <div
          className="loading-overlay"
          role="status"
          aria-live="polite"
          aria-label="メンバーを計算中"
        >
          <div className="loading-content">
            <span
              className="loading-spinner"
              aria-hidden="true"
            />
            <p>計算中</p>
          </div>
        </div>
      )}

      <h1>
        🏀チーム作成🏀
      </h1>

      {/* =============================================== */}
      {/* 参加者 */}
      {/* =============================================== */}

      <section className="card">

        <h2>
          --- 参加者登録 ---
        </h2>

        <div className="position-mode">
          <label>
            <input
              type="checkbox"
              checked={usePositions}
              onChange={(e) => {
                setUsePositions(
                  e.target.checked
                )
                setPosition('')
                setInputError('')
                setGames([])
              }}
            />

            ポジション設定を使う
          </label>

          {usePositions && (
            <p className="position-help">
              ONの場合は全員にG・F・Cを設定してください
            </p>
          )}
        </div>

        <div className="input-area">

          <input
            value={
              name
            }
            onChange={(e) => {
              setName(
                e.target.value
              )
              setInputError('')
            }}
            onKeyDown={(e) => {
              if (
                e.key ===
                'Enter'
              ) {
                addPlayer()
              }
            }}
            placeholder="参加者の名前"
            maxLength={10}
          />

          {usePositions && (
            <div
              className="position-picker"
              aria-label="新しい参加者のポジション"
            >
              {(['G', 'F', 'C'] as const).map(
                (value) => (
                  <button
                    type="button"
                    className={
                      position === value
                        ? 'position-button selected'
                        : 'position-button'
                    }
                    aria-pressed={
                      position === value
                    }
                    key={value}
                    onClick={() => {
                      setPosition(value)
                      setInputError('')
                    }}
                  >
                    {value}
                  </button>
                )
              )}
            </div>
          )}

          <button
            className="add-player-button"
            onClick={
              addPlayer
            }
            disabled={
              addPlayerDisabled
            }
          >
            追加
          </button>

        </div>

        {inputError && (
          <p
            className="input-error"
            role="alert"
          >
            {inputError}
          </p>
        )}

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

                {editingPlayer === player ? (
                  <div className="player-name-editor">
                    <input
                      autoFocus
                      value={editingName}
                      maxLength={10}
                      aria-label={`${player}の名前を編集`}
                      onFocus={(e) => {
                        e.currentTarget.select()
                      }}
                      onChange={(e) => {
                        setEditingName(
                          e.target.value
                        )
                        setEditError('')
                      }}
                      onBlur={saveEditedPlayer}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }

                        if (e.key === 'Escape') {
                          cancelEditingPlayer()
                        }
                      }}
                    />

                    {editError && (
                      <span
                        className="edit-error"
                        role="alert"
                      >
                        {editError}
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    className="player-name player-name-button"
                    onClick={() =>
                      startEditingPlayer(player)
                    }
                    aria-label={`${player}の名前を編集`}
                  >
                    {player}
                  </button>
                )}

                {usePositions &&
                  editingPlayer !== player && (
                  <div
                    className="position-picker player-position-picker"
                    aria-label={`${player}のポジション`}
                  >
                    {(['G', 'F', 'C'] as const).map(
                      (value) => (
                        <button
                          type="button"
                          className={
                            positions[player] === value
                              ? 'position-button selected'
                              : 'position-button'
                          }
                          aria-pressed={
                            positions[player] === value
                          }
                          key={value}
                          onClick={() =>
                            updatePlayerPosition(
                              player,
                              value
                            )
                          }
                        >
                          {value}
                        </button>
                      )
                    )}
                  </div>
                )}

                {editingPlayer !== player && (
                <button
                  className="remove-player-button"
                  aria-label={`${player}を削除`}
                  onClick={() =>
                    removePlayer(
                      index
                    )
                  }
                >
                  削除
                </button>
                )}

              </li>
            )
          )}

        </ul>

        {players.length > 0 && (
          <button
            className="clear-players-button"
            onClick={clearPlayers}
          >
            参加者を全員削除
          </button>
        )}

      </section>

      {/* =============================================== */}
      {/* 試合設定 */}
      {/* =============================================== */}

      <section className="card">

        <h2>
          --- 試合設定 ---
        </h2>

        <label>

          試合数：

          <input
            type="number"
            min={MIN_GAMES}
            max={MAX_GAMES}
            value={
              gameCount
            }
            onChange={(e) =>
              setGameCount(
                Math.min(
                  MAX_GAMES,
                  Math.max(
                    MIN_GAMES,
                    Number(
                      e.target.value
                    )
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
      {/* 履歴 */}
      {/* =============================================== */}

      {history.length >
        0 && (

        <section className="card history-card">

          <h2>
            📜 生成履歴 📜
          </h2>

          <p className="history-description">
            直近3回の生成結果を保存しています
          </p>

          <div className="history-list">

            {history.map(
              (
                item,
                index
              ) => (

                <div
                  className="history-item"
                  key={
                    item.id
                  }
                >

                  <div className="history-info">

                    <div className="history-title">

                      {index ===
                        0 && (

                        <span className="history-latest">
                          最新
                        </span>

                      )}

                      {formatHistoryDate(
                        item.createdAt
                      )}

                    </div>

                    <div className="history-meta">

                      {
                        item.players.length
                      }
                      人
                      {' / '}
                      {
                        item.gameCount
                      }
                      試合

                    </div>

                  </div>

                  <div className="history-actions">

                    <button
                      className="history-load-button"
                      onClick={() =>
                        loadHistory(
                          item
                        )
                      }
                    >
                      この結果を見る
                    </button>

                    <button
                      className="history-delete-button"
                      onClick={() =>
                        deleteHistory(
                          item.id
                        )
                      }
                    >
                      削除
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      )}

      {/* =============================================== */}
      {/* 結果 */}
      {/* =============================================== */}

      {games.length >
        0 && (

        <>

          <section className="card">

            <h2>
              📊 出場状況 📊
            </h2>

            <div className="result-actions share-buttons">
              <button
                className="share-button"
                onClick={shareResult}
              >
                📤 結果を共有
              </button>

              <button
                className="copy-button"
                onClick={copyResult}
              >
                📋 結果をコピー
              </button>
            </div>

            <div
              className="result-tabs"
              role="tablist"
              aria-label="出場状況の表示切替"
            >
              <button
                role="tab"
                aria-selected={
                  resultView === 'games'
                }
                className={
                  resultView === 'games'
                    ? 'result-tab active'
                    : 'result-tab'
                }
                onClick={() =>
                  setResultView('games')
                }
              >
                試合別
              </button>

              <button
                role="tab"
                aria-selected={
                  resultView === 'summary'
                }
                className={
                  resultView === 'summary'
                    ? 'result-tab active'
                    : 'result-tab'
                }
                onClick={() =>
                  setResultView('summary')
                }
              >
                集計
              </button>
            </div>

            {resultView === 'games' && (
            <div className="legend">

              <span>
                ○：出場
              </span>

              <span>
                休：休憩
              </span>

              <span>
                ③：3連続
              </span>

              <span>
                ④：4連続以上
              </span>

            </div>
            )}

            <div
              className={
                resultView === 'summary'
                  ? 'table-wrapper summary-table-wrapper'
                  : 'table-wrapper'
              }
            >

              <table
                className={
                  resultView === 'summary'
                    ? 'attendance-table summary-table'
                    : 'attendance-table'
                }
              >

                <thead>

                  <tr>

                    <th>
                      参加者
                    </th>

                    {resultView === 'games' && games.map(
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

                    {resultView === 'summary' && (
                      <>
                        <th>出場</th>
                        <th>休憩</th>
                        <th>
                          最大
                          <br />
                          連続
                          <br />
                          出場
                        </th>
                        <th>
                          最大
                          <br />
                          連続
                          <br />
                          休憩
                        </th>
                      </>
                    )}

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

                            {usePositions &&
                              positions[player] && (
                                <span className="position-badge table-position-badge">
                                  {positions[player]}
                                </span>
                              )}
                          </td>

                          {resultView === 'games' && games.map(
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
                                    : '休'}

                                </td>

                              )
                            }
                          )}

                          {resultView === 'summary' && (
                            <>
                              <td>{s.plays}</td>
                              <td>{s.rests}</td>
                              <td>{s.maxPlayStreak}</td>
                              <td>{s.maxRestStreak}</td>
                            </>
                          )}

                        </tr>

                      )
                    }
                  )}

                </tbody>

              </table>

            </div>

            <div className="explanation">



              <p>
                3連続出場は完全禁止ではなく、
                <strong>
                  連続出場が特定の人に
                  偏らないように
                </strong>
                調整しています。
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
              👶 試合メンバー 👶
            </h2>

<div className="share-buttons">

  <button
    className="share-button"
    onClick={shareResult}
  >
    📤 結果を共有
  </button>

  <button
    className="copy-button"
    onClick={copyResult}
  >
    📋 結果をコピー
  </button>

</div>

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

                            {usePositions &&
                              positions[player] && (
                                <span className="position-badge">
                                  {positions[player]}
                                </span>
                              )}
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
              👥 5人組の重複 👥
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
                            .split('|')
                            .join('・')}
                        </strong>

                        ：
                        {
                          count
                        }
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
