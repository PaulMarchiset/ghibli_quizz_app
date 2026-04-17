// -------------------------------------------------------
// this file is for handling reports about quiz questions!
// --------------------------------------------------------

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

type ReportChoice = {
  id: string;
  label: string;
};

type StoredQuestion = {
  id: string;
  type: string;
  prompt: string;
  image: string | null;
  choices: ReportChoice[];
  correctChoiceId: string;
  correctChoiceLabel: string | null;
  reportContext: Record<string, unknown> | null;
};

type StoredReport = {
  id: string;
  reportedAt: string;
  reason: 'wrong-image';
  details: string | null;
  question: StoredQuestion;
  gameplay: {
    questionIndex: number;
    totalQuestions: number;
    selectedChoiceId: string | null;
    answered: boolean;
    mode: 'solo' | 'multiplayer';
    roomCode: string | null;
  };
  reporter: {
    playerName: string;
    appRoute: string;
    userAgent: string;
  };
  clientReportedAt: string;
};

const REPORT_FILE_RELATIVE = 'report/question-image-reports.json';
const REPORT_FILE_ABSOLUTE = join(process.cwd(), REPORT_FILE_RELATIVE);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toInteger(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function parseChoices(value: unknown): ReportChoice[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((choice) => ({
      id: toNonEmptyString(choice.id),
      label: toNonEmptyString(choice.label)
    }))
    .filter((choice) => choice.id.length > 0 && choice.label.length > 0);
}

function parseQuestion(value: unknown): StoredQuestion | null {
  if (!isRecord(value)) return null;

  const id = toNonEmptyString(value.id);
  const type = toNonEmptyString(value.type);
  const prompt = toNonEmptyString(value.prompt);
  const correctChoiceId = toNonEmptyString(value.correctChoiceId);
  const choices = parseChoices(value.choices);

  if (!id || !type || !prompt || !correctChoiceId || choices.length < 2) {
    return null;
  }

  return {
    id,
    type,
    prompt,
    image: toNullableString(value.image),
    choices,
    correctChoiceId,
    correctChoiceLabel: toNullableString(value.correctChoiceLabel),
    reportContext: isRecord(value.reportContext) ? value.reportContext : null
  };
}

async function readReports(): Promise<StoredReport[]> {
  try {
    const raw = await readFile(REPORT_FILE_ABSOLUTE, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredReport[]) : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') return [];

    throw error;
  }
}

async function writeReports(reports: StoredReport[]) {
  await mkdir(dirname(REPORT_FILE_ABSOLUTE), { recursive: true });
  await writeFile(REPORT_FILE_ABSOLUTE, `${JSON.stringify(reports, null, 2)}\n`, 'utf-8');
}

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event);
  if (!isRecord(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report payload' });
  }

  const reason = body.reason === 'wrong-image' ? 'wrong-image' : null;
  if (!reason) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported report reason' });
  }

  const question = parseQuestion(body.question);
  if (!question) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid question payload' });
  }

  const gameplay = isRecord(body.gameplay) ? body.gameplay : {};
  const reporter = isRecord(body.reporter) ? body.reporter : {};

  const report: StoredReport = {
    id: crypto.randomUUID(),
    reportedAt: new Date().toISOString(),
    reason,
    details: toNullableString(body.details),
    question,
    gameplay: {
      questionIndex: Math.max(1, toInteger(gameplay.questionIndex, 1)),
      totalQuestions: Math.max(1, toInteger(gameplay.totalQuestions, 1)),
      selectedChoiceId: toNullableString(gameplay.selectedChoiceId),
      answered: toBoolean(gameplay.answered),
      mode: gameplay.mode === 'multiplayer' ? 'multiplayer' : 'solo',
      roomCode: toNullableString(gameplay.roomCode)
    },
    reporter: {
      playerName: toNonEmptyString(reporter.playerName, 'Unknown player'),
      appRoute: toNonEmptyString(reporter.appRoute, '/game'),
      userAgent: toNonEmptyString(reporter.userAgent, 'unknown')
    },
    clientReportedAt: toNonEmptyString(body.clientReportedAt, new Date().toISOString())
  };

  const reports = await readReports();
  reports.push(report);
  await writeReports(reports);

  return {
    ok: true,
    reportId: report.id,
    storedIn: REPORT_FILE_RELATIVE
  };
});
