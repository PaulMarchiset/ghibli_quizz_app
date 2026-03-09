export type QuestionTypeSelection =
  | 'all'
  | 'character-species'
  | 'character-movie'
  | 'movie-character'
  | 'japanese-name'

export type GameSettings = {
  pseudo: string
  questionSeconds: number
  quizLength: number
  questionType: QuestionTypeSelection
}

export function useGameSettings() {
  const defaults: GameSettings = {
    pseudo: '',
    questionSeconds: 15,
    quizLength: 10,
    questionType: 'all'
  }

  const settingsCookie = useCookie<GameSettings>('gameSettings', {
    default: () => ({ ...defaults }),
    encode: (value) => encodeURIComponent(JSON.stringify(value ?? defaults)),
    decode: (value) => {
      try {
        return JSON.parse(decodeURIComponent(value)) as GameSettings
      } catch {
        return { ...defaults }
      }
    }
  })

  const state = useState<GameSettings>('gameSettings', () => settingsCookie.value ?? { ...defaults })

  watch(
    state,
    (value) => {
      settingsCookie.value = value
    },
    { deep: true }
  )

  return state
}
