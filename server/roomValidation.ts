import { SharedQuizQuestion } from './types'

export function requireRoomCode(code?: string) {
  const normalized = code?.trim().toUpperCase()
  if (!normalized) throw new Error('Room code required')
  return normalized
}

export function validateQuestions(value: unknown): value is SharedQuizQuestion[] {
  return Array.isArray(value) && value.length > 0
}