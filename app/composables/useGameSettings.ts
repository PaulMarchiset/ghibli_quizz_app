import { QUESTION_TYPE_KEYS, type QuestionTypeKey } from '~/services/game/quizGame'

export type QuestionTypeSelection = QuestionTypeKey

export type GameSettings = {
  pseudo: string
  questionSeconds: number
  quizLength: number
  questionTypes: QuestionTypeSelection[]
}

/**
 * Composable for managing and persisting game settings (e.g., timers, question types) using cookies and reactive global state.
 * @returns A reactive state object containing the current game configurations.
 */

export function useGameSettings() {
  const defaults: GameSettings = {
    pseudo: '',
    questionSeconds: 15,
    quizLength: 10,
    questionTypes: [...QUESTION_TYPE_KEYS]
  }

  function normalizeQuestionTypes(values: unknown) {
    const list = Array.isArray(values) ? values : []
    const filtered = list.filter((value): value is QuestionTypeKey =>
      QUESTION_TYPE_KEYS.includes(value as QuestionTypeKey)
    )

    return filtered.length > 0 ? filtered : [...QUESTION_TYPE_KEYS]
  }

  function normalizeSettings(value: unknown): GameSettings {
    if (!value || typeof value !== 'object') return { ...defaults }

    const candidate = value as Partial<GameSettings> & { questionType?: string }
    const fallback = { ...defaults, ...candidate }

    return {
      ...fallback,
      questionTypes: normalizeQuestionTypes(
        Array.isArray(candidate.questionTypes)
          ? candidate.questionTypes
          : typeof candidate.questionType === 'string'
            ? [candidate.questionType]
            : fallback.questionTypes
      )
    }
  }

  const settingsCookie = useCookie<GameSettings>('gameSettings', {
    default: () => ({ ...defaults }),
    encode: (value) => encodeURIComponent(JSON.stringify(value ?? defaults)),
    decode: (value) => {
      try {
        return normalizeSettings(JSON.parse(decodeURIComponent(value)))
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
