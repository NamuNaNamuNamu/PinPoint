import { questionTemplates } from "./QuestionTemplates.generated";
import type { QuestionTemplate } from "./QuestionTemplateTypes";

export type { AnswerRatio, QuestionSliderDefinition, QuestionTemplate } from "./QuestionTemplateTypes";
export { questionTemplates };

/**
 * 指定 ID の問題テンプレートを取得する。
 */
export function getQuestionTemplate(questionId: number): QuestionTemplate | undefined {
    return questionTemplates.find((questionTemplate) => questionTemplate.id === questionId);
}
