/**
 * Slider 上の正解位置を、左端を 0、右端を 1 とした比率で表す。
 */
export type AnswerRatio = number;

/** 
 問題内に表示する Slider の定義。
 */
export type QuestionSliderDefinition = {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    /** Slider 幅に対する正解位置の比率。 */
    correctAnswerRatio: AnswerRatio;
};

/**
 * サーバー主導で配布する問題テンプレート。
 */
export type QuestionTemplate = {
    id: number;
    question: string;
    choiceLeft: string;
    choiceRight: string;
    sliders: readonly QuestionSliderDefinition[];
};

/**
 * 利用可能な問題テンプレート。
 */
export const questionTemplates: readonly QuestionTemplate[] = [
    {
        id: 1,
        question: "自分はインドア派かアウトドア派か",
        choiceLeft: "インドア",
        choiceRight: "アウトドア",
        sliders: [
            {
                id: "question-1-slider-1",
                name: "かな",
                x: 100,
                y: 220,
                width: 600,
                height: 200,
                correctAnswerRatio: 0.5,
            },
            {
                id: "question-1-slider-2",
                name: "いおり",
                x: 100,
                y: 520,
                width: 600,
                height: 200,
                correctAnswerRatio: 0.35,
            },
            {
                id: "question-1-slider-3",
                name: "しおり",
                x: 100,
                y: 820,
                width: 600,
                height: 200,
                correctAnswerRatio: 0.85,
            },
        ],
    },
    {
        id: 2,
        question:
            "友人と食事をしていたところ、友人の知り合いがたまたま通りかかりました。\n友人とその人は仲良く話始めてしまいましたが、あなたならどうしますか。",
        choiceLeft: "話が終わるまで空気になる",
        choiceRight: "話に混じる",
        sliders: [
            {
                id: "question-2-slider-1",
                name: "るな",
                x: 100,
                y: 220,
                width: 600,
                height: 200,
                correctAnswerRatio: 0.4,
            },
            {
                id: "question-2-slider-2",
                name: "ありさ",
                x: 100,
                y: 520,
                width: 600,
                height: 200,
                correctAnswerRatio: 0.75,
            },
            {
                id: "question-2-slider-3",
                name: "ひで",
                x: 100,
                y: 820,
                width: 600,
                height: 200,
                correctAnswerRatio: 0.6,
            },
        ],
    },
];

/**
 * 指定 ID の問題テンプレートを取得する。
 */
export function getQuestionTemplate(questionId: number): QuestionTemplate | undefined {
    return questionTemplates.find((questionTemplate) => questionTemplate.id === questionId);
}
