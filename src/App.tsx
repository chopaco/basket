import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './App.css'
import {
  generateGames,
  getPositionRating,
} from './generator'
import kanakoBossImage from './assets/kanako-boss.webp'

type Game = {
  gameNumber: number
  players: string[]
}

type Position = 'G' | 'F' | 'C' | ''

type ShareData = {
  players: string[]
  games: Game[]
  usePositions: boolean
  positions: Record<
    string,
    Position
  >
}

type CompactShareData = {
  v: 1
  p: string[]
  g: number[][]
  u: boolean
  o: string
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

const MIN_PLAYERS = 6
const MAX_PLAYERS = 12
const MIN_GAMES = 1
const MAX_GAMES = 16
const MAX_HISTORY = 3
const APP_VERSION = '9.9'

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

const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  const binary = Array.from(
    bytes,
    (byte) => String.fromCharCode(byte)
  ).join('')

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

const decodeBase64Url = (value: string) => {
  const base64 = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  )

  return new TextDecoder().decode(bytes)
}

const parseCompactShareData = (
  encoded: string
): ShareData | null => {
  const parsed = JSON.parse(
    decodeBase64Url(encoded)
  ) as Partial<CompactShareData>

  if (
    parsed.v !== 1 ||
    !Array.isArray(parsed.p) ||
    !Array.isArray(parsed.g) ||
    typeof parsed.o !== 'string'
  ) {
    return null
  }

  const players = parsed.p
  const gameIndexes = parsed.g

  if (
    !players.every((player) => typeof player === 'string') ||
    !gameIndexes.every(
      (game) =>
        Array.isArray(game) &&
        game.length === 5 &&
        game.every(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < players.length
        )
    )
  ) {
    return null
  }

  const positions = Object.fromEntries(
    players.map((player, index) => {
      const position = parsed.o?.[index]

      return [
        player,
        position === 'G' || position === 'F' || position === 'C'
          ? position
          : '',
      ]
    })
  ) as Record<string, Position>

  return {
    players,
    games: gameIndexes.map((game, index) => ({
      gameNumber: index + 1,
      players: game.map((playerIndex) => players[playerIndex]),
    })),
    usePositions: parsed.u === true,
    positions,
  }
}

const parseLegacyShareData = (
  encoded: string
): ShareData | null => {
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
    usePositions: parsed.usePositions === true,
    positions:
      parsed.positions && typeof parsed.positions === 'object'
        ? parsed.positions
        : {},
  }
}

const loadSharedData = (): ShareData | null => {
  try {
    const compactPrefix = '#r='
    const legacyPrefix = '#result='

    if (window.location.hash.startsWith(compactPrefix)) {
      return parseCompactShareData(
        window.location.hash.slice(compactPrefix.length)
      )
    }

    if (window.location.hash.startsWith(legacyPrefix)) {
      return parseLegacyShareData(
        window.location.hash.slice(legacyPrefix.length)
      )
    }

    return null
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

  const [showLoadingOverlay, setShowLoadingOverlay] =
    useState(false)

  const loadingShownAt = useRef<number | null>(null)

  const [showKanakoBoss, setShowKanakoBoss] =
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
    let timer: number

    if (isGenerating) {
      timer = window.setTimeout(() => {
        loadingShownAt.current = performance.now()
        setShowLoadingOverlay(true)
      }, 180)
    } else if (loadingShownAt.current !== null) {
      const elapsed =
        performance.now() - loadingShownAt.current
      const remaining = Math.max(0, 320 - elapsed)

      timer = window.setTimeout(() => {
        loadingShownAt.current = null
        setShowLoadingOverlay(false)
      }, remaining)
    } else {
      setShowLoadingOverlay(false)
    }

    return () => window.clearTimeout(timer)
  }, [isGenerating])

  useEffect(() => {
    if (!showKanakoBoss) return

    const timer = window.setTimeout(
      () => setShowKanakoBoss(false),
      5000
    )

    return () => window.clearTimeout(timer)
  }, [showKanakoBoss])

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

  // 統計
  // =========================================================

  const calculateStats = useCallback((
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
  }, [players])

  // =========================================================
  // 5人組
  // =========================================================

  const getTeamCounts = useCallback((
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
  }, [])

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

    const maybeShowKanakoBoss = () => {
      if (
        players.includes('かなこ') &&
        Math.random() < 0.1
      ) {
        setShowKanakoBoss(true)
      }
    }

    const runMainThreadFallback = () => {
      try {
        const result = generateGames({
          players,
          gameCount,
          usePositions,
          positions,
        })

        setGames(result)
        saveHistory(result)
        maybeShowKanakoBoss()
      } catch {
        alert(
          '条件を満たす組み合わせを作成できませんでした。もう一度生成してください。'
        )
      } finally {
        setIsGenerating(false)
      }
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
          maybeShowKanakoBoss()
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

  const { stats, duplicateTeams } = useMemo(() => {
    const nextStats = calculateStats(games)
    const teamCounts = getTeamCounts(games)
    const nextDuplicateTeams = Object.entries(teamCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])

    return {
      stats: nextStats,
      duplicateTeams: nextDuplicateTeams,
    }
  }, [calculateStats, games, getTeamCounts])

  const hasForbiddenPositionLineup = useMemo(
    () =>
      usePositions &&
      games.some(
        (game) =>
          getPositionRating(
            game.players,
            players,
            positions,
            usePositions
          ) === 'forbidden'
      ),
    [games, players, positions, usePositions]
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
  const playerIndexes = new Map(
    players.map((player, index) => [player, index])
  )
  const data: CompactShareData = {
    v: 1,
    p: players,
    g: games.map((game) =>
      game.players.map((player) => playerIndexes.get(player) ?? -1)
    ),
    u: usePositions,
    o: players.map((player) => positions[player] || '-').join(''),
  }

  const encoded = encodeBase64Url(
    JSON.stringify(data)
  )

  return (
    window.location.origin +
    window.location.pathname +
    '#r=' +
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

      {showLoadingOverlay && (
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

      {showKanakoBoss && (
        <button
          type="button"
          className="kanako-boss-overlay"
          onClick={() =>
            setShowKanakoBoss(false)
          }
          aria-label="かなこ親分の演出を閉じる"
        >
          <span className="kanako-boss-content">
            <strong>
              かなこ親分参戦！！！
            </strong>
            <img
              src={kanakoBossImage}
              alt="かなこ親分"
            />
            <small>
              タップで閉じる
            </small>
          </span>
        </button>
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

          {showLoadingOverlay
            ? '計算中...'
            : 'メンバーを作成'}

        </button>

        {showLoadingOverlay && (
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

          {hasForbiddenPositionLineup && (
            <p className="position-warning" role="note">
              注意：出場回数などの条件を満たすため、
              禁止構成を含む試合があります。
              試合別のポジション構成をご確認ください。
            </p>
          )}

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

      <footer className="app-version">
        Ver. {APP_VERSION}
      </footer>

    </div>
  )
}

export default App
