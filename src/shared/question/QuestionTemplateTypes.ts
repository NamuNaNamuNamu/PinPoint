/** Slider 上の正解位置を、左端を 0、右端を 1 とした比率で表す。 */
export type AnswerRatio = number;

/** 問題内に表示する、既定値補完済み Slider の定義。 */
export type QuestionSliderDefinition = {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    correctAnswerRatio: AnswerRatio;
};

/** サーバー主導で配布する、既定値補完済み問題テンプレート。 */
export type QuestionTemplate = {
    id: number;
    question: string;
    choiceLeft: string;
    choiceRight: string;
    sliders: readonly QuestionSliderDefinition[];
};
