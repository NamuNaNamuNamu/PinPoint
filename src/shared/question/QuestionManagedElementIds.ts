import type { QuestionTemplate } from "./QuestionTemplate";
import { questionTemplates } from "./QuestionTemplate";

/**
 * 問題テンプレートが scene を管理する Excalidraw 要素 ID を取得する。
 *
 * @param question 管理要素を取得する問題テンプレート。
 * @returns 問題文、選択肢、Slider、正解マーカーの要素 ID。
 */
export function getQuestionManagedElementIds(question: QuestionTemplate): ReadonlySet<string> {
    return new Set([
        `question-${question.id}`,
        `choice-left-${question.id}`,
        `choice-right-${question.id}`,
        ...question.sliders.flatMap((slider) => [
            `rectangle-${slider.id}`,
            `text-${slider.id}`,
            `correct-answer-${slider.id}`,
            `correct-answer-flag-${slider.id}`,
        ]),
    ]);
}

/**
 * 全問題テンプレートが scene を管理する Excalidraw 要素 ID を取得する。
 *
 * @returns 全テンプレートの管理要素 ID。
 */
export function getAllQuestionManagedElementIds(): ReadonlySet<string> {
    return new Set(questionTemplates.flatMap((question) => [...getQuestionManagedElementIds(question)]));
}
