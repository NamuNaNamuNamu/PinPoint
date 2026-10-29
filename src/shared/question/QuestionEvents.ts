import type { AnswerBarAdded } from "../answerBar/AnswerBarEvents";
import type { QuestionTemplate } from "./QuestionTemplate";

/**
 * 問題をルームへ適用する要求。
 */
export type ApplyQuestionRequest = {
    roomId: string;
    questionId: number;
    deleteExternalElements: boolean;
    scrollToContent?: boolean;
};

/**
 * 問題適用要求に対するサーバーの応答。
 *
 * `ok: false` の場合、ルーム状態および scene は変更されない。
 */
export type ApplyQuestionResult =
    | { ok: true }
    | {
          ok: false;
          reason: "invalid-request" | "room-not-found" | "question-not-found" | "not-creator" | "not-member";
      };

/**
 * 現在問題の管理外要素削除・スクロールを要求する入力。
 */
export type ControlCurrentQuestionRequest = {
    roomId: string;
    deleteExternalElements: boolean;
    scrollToContent: boolean;
};

/**
 * サーバーが問題適用時に配布する状態。
 */
export type QuestionApplied = {
    question: QuestionTemplate;
    answerBars: readonly AnswerBarAdded[];
    deleteExternalElements: boolean;
    scrollToContent: boolean;
};

/** 現在の問題の正解を表示する通知。 */
export type QuestionRevealed = { questionId: number };
