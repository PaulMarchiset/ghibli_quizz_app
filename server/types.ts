// domain/types.ts
export type Player = { id: string; name: string; score: number }

export type RoomPhase = 'lobby' | 'playing' | 'ended'

export type SharedQuizQuestion = {
  id: string
  type: 'character-species' | 'character-movie' | 'movie-character' | 'japanese-name'
  prompt: string
  image?: string
  choices: { id: string; label: string }[]
  correctChoiceId: string
}

export type Room = {
  code: string
  hostId: string
  players: Player[]
  phase: RoomPhase
  questions: SharedQuizQuestion[]
  questionSeconds: number
  answeredByQuestion: Record<string, string[]>
}