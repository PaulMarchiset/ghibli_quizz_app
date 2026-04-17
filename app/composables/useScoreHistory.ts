export type ScoreHistoryEntry = {
  id: string
  playerName: string
  points: number
  totalQuestions: number
  questionType: string
  questionSeconds: number
  playedAt: string
}

const STORAGE_KEY = 'quizScoreHistory'

function isScoreHistoryEntry(value: unknown): value is ScoreHistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.playerName === 'string' &&
    typeof candidate.points === 'number' &&
    typeof candidate.totalQuestions === 'number' &&
    typeof candidate.questionType === 'string' &&
    typeof candidate.questionSeconds === 'number' &&
    typeof candidate.playedAt === 'string'
  )
}

function sortByDateDesc(entries: ScoreHistoryEntry[]) {
  return [...entries].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  )
}

/**
 * Composable for managing and persisting the user's game score history using local storage.
 * @returns An object containing reactive history entries and methods to add or clear scores.
 * @NOTE there might be some bugs with history on multiplayer games
 */

export function useScoreHistory() {
  const entries = useState<ScoreHistoryEntry[]>('scoreHistoryEntries', () => [])
  const loaded = useState<boolean>('scoreHistoryLoaded', () => false)

  function ensureLoaded() {
    if (loaded.value || !import.meta.client) return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        entries.value = []
        loaded.value = true
        return
      }

      const parsed = JSON.parse(raw)
      entries.value = Array.isArray(parsed)
        ? sortByDateDesc(parsed.filter(isScoreHistoryEntry))
        : []
    } catch {
      entries.value = []
    } finally {
      loaded.value = true
    }
  }

  function persist() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
  }

  function addEntry(entry: Omit<ScoreHistoryEntry, 'id' | 'playedAt'>) {
    ensureLoaded()

    const nextEntry: ScoreHistoryEntry = {
      id: crypto.randomUUID(),
      playedAt: new Date().toISOString(),
      ...entry
    }

    entries.value = sortByDateDesc([nextEntry, ...entries.value])
    persist()
  }

  function clearHistory() {
    ensureLoaded()
    entries.value = []
    persist()
  }

  return {
    entries,
    ensureLoaded,
    addEntry,
    clearHistory
  }
}
