import {
  GENERATION_VERSION,
  generateGames,
  type GenerateRequest,
} from './generator'

self.onmessage = (
  event: MessageEvent<GenerateRequest>
) => {
  try {
    self.postMessage({
      type: 'complete',
      generationVersion: GENERATION_VERSION,
      games: generateGames(event.data),
    })
  } catch (error) {
    self.postMessage({
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : '生成に失敗しました',
    })
  }
}
