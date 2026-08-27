import assert from 'node:assert/strict'
import test from 'node:test'

import {
  generateGames,
  getPositionRating,
} from '../src/generator.ts'

const TEAM_SIZE = 5

const createPlayers = (count) =>
  Array.from({ length: count }, (_, index) => `P${index + 1}`)

const countPlays = (games, players) =>
  Object.fromEntries(
    players.map((player) => [
      player,
      games.filter((game) => game.players.includes(player)).length,
    ])
  )

const assertNoThreeConsecutiveRests = (games, players) => {
  players.forEach((player) => {
    let restStreak = 0

    games.forEach((game) => {
      restStreak = game.players.includes(player) ? 0 : restStreak + 1
      assert.ok(
        restStreak <= 2,
        `${player}が第${game.gameNumber}試合で3連続休憩になっています`
      )
    })
  })
}

const assertScheduleRules = (games, players, gameCount) => {
  const registeredPlayers = new Set(players)

  assert.equal(games.length, gameCount, '指定した試合数と一致しません')

  games.forEach((game, index) => {
    assert.equal(game.gameNumber, index + 1, '試合番号が連番ではありません')
    assert.equal(game.players.length, TEAM_SIZE, '出場者が5人ではありません')
    assert.equal(
      new Set(game.players).size,
      TEAM_SIZE,
      '同じ試合に参加者が重複しています'
    )
    game.players.forEach((player) => {
      assert.ok(registeredPlayers.has(player), `未登録の参加者 ${player} がいます`)
    })
  })

  const playCounts = Object.values(countPlays(games, players))
  const expectedMinimum = Math.floor((gameCount * TEAM_SIZE) / players.length)
  const expectedMaximum = Math.ceil((gameCount * TEAM_SIZE) / players.length)

  assert.equal(
    playCounts.reduce((total, count) => total + count, 0),
    gameCount * TEAM_SIZE,
    '出場枠の合計が一致しません'
  )
  playCounts.forEach((count) => {
    assert.ok(
      count === expectedMinimum || count === expectedMaximum,
      `出場回数 ${count} が公平配分の範囲外です`
    )
  })

  assertNoThreeConsecutiveRests(games, players)
}

test('6〜12人の代表的な試合数で必須生成ルールを守る', { timeout: 60_000 }, () => {
  const gameCounts = [1, 8, 12, 16]

  for (let playerCount = 6; playerCount <= 12; playerCount++) {
    for (const gameCount of gameCounts) {
      const players = createPlayers(playerCount)
      const games = generateGames({
        players,
        gameCount,
        usePositions: false,
        positions: {},
      })

      assertScheduleRules(games, players, gameCount)
    }
  }
})

test('ポジションONでも必須生成ルールを守る', { timeout: 60_000 }, () => {
  const players = createPlayers(9)
  const positions = Object.fromEntries(
    players.map((player, index) => [player, ['G', 'F', 'C'][index % 3]])
  )
  const games = generateGames({
    players,
    gameCount: 16,
    usePositions: true,
    positions,
  })

  assertScheduleRules(games, players, 16)
})

test('全員が同じポジションならポジション評価を無効にする', () => {
  const players = createPlayers(7)
  const positions = Object.fromEntries(players.map((player) => [player, 'G']))

  assert.equal(
    getPositionRating(players.slice(0, 5), players, positions, true),
    'ideal'
  )
})

test('G・F・Cがいる場合の理想構成と禁止構成を判定する', () => {
  const players = ['G1', 'G2', 'G3', 'G4', 'F1', 'F2', 'C1', 'C2']
  const positions = {
    G1: 'G', G2: 'G', G3: 'G', G4: 'G',
    F1: 'F', F2: 'F', C1: 'C', C2: 'C',
  }

  assert.equal(
    getPositionRating(['G1', 'G2', 'F1', 'C1', 'C2'], players, positions, true),
    'ideal'
  )
  assert.equal(
    getPositionRating(['G1', 'G2', 'G3', 'G4', 'F1'], players, positions, true),
    'forbidden'
  )
})

test('Gが過半数ならG3構成を禁止ではなく避けたいと判定する', () => {
  const players = ['G1', 'G2', 'G3', 'G4', 'G5', 'F1', 'F2', 'C1']
  const positions = {
    G1: 'G', G2: 'G', G3: 'G', G4: 'G', G5: 'G',
    F1: 'F', F2: 'F', C1: 'C',
  }

  assert.equal(
    getPositionRating(['G1', 'G2', 'G3', 'F1', 'C1'], players, positions, true),
    'avoid'
  )
})

test('ポジション欠損時の定義済み構成を判定する', () => {
  const noGuardPlayers = ['F1', 'F2', 'F3', 'F4', 'C1', 'C2']
  const noGuardPositions = {
    F1: 'F', F2: 'F', F3: 'F', F4: 'F', C1: 'C', C2: 'C',
  }
  assert.equal(
    getPositionRating(
      ['F1', 'F2', 'F3', 'C1', 'C2'],
      noGuardPlayers,
      noGuardPositions,
      true
    ),
    'ideal'
  )

  const noForwardPlayers = ['G1', 'G2', 'G3', 'G4', 'G5', 'C1']
  const noForwardPositions = {
    G1: 'G', G2: 'G', G3: 'G', G4: 'G', G5: 'G', C1: 'C',
  }
  assert.equal(
    getPositionRating(
      ['G1', 'G2', 'G3', 'G4', 'G5'],
      noForwardPlayers,
      noForwardPositions,
      true
    ),
    'forbidden'
  )
})
