import type { QuizQuestion } from "../game/quizGame";
import { fetchJsonOrFallback } from "./api";

export type QuestionIssueReason = 'wrong-image';


export type QuestionReportPayload = {
    reason: QuestionIssueReason;
    details?: string;
    question: Pick<QuizQuestion, 'id' | 'type' | 'prompt' | 'image' | 'choices' | 'correctChoiceId' | 'reportContext'> & {
        correctChoiceLabel?: string;
    };
    gameplay: {
        questionIndex: number;
        totalQuestions: number;
        selectedChoiceId: string | null;
        answered: boolean;
        mode: 'solo' | 'multiplayer';
        roomCode?: string;
    };
    reporter: {
        playerName: string;
        appRoute: string;
        userAgent: string;
    };
    clientReportedAt: string;
};

export type QuestionReportResponse = {
    ok: boolean;
    reportId?: string;
    storedIn?: string;
    message?: string;
};

/**
 * Sends a report about a quiz question issue to the server.
 * @param payload The details of the question issue being reported.
 * @returns A promise resolving to the server's response indicating success or failure of the report submission.
 */

export async function reportQuestionIssue(payload: QuestionReportPayload): Promise<QuestionReportResponse> {
    return fetchJsonOrFallback<QuestionReportResponse, QuestionReportResponse>(
        '/api/reports/question',
        {
            context: 'reportQuestionIssue',
            fallback: {
                ok: false,
                message: 'Unable to send report'
            },
            init: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        }
    );
}
