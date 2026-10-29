import type { AnswerBarAdded } from "../../../shared/answerBar/AnswerBarEvents";
import type { QuestionTemplate } from "../../../shared/question/QuestionTemplate";

/**
 * 回答バーと正解位置の距離から問題内の加点を計算する。
 */
export class ScoreCalculator {
    /**
     * 各参加者について、問題に含まれる Slider の得点を合算する。
     *
     * Slider ごとの得点は、正解位置を 100 点、左右端のうち正解位置から遠い側を 0 点として
     * 距離に比例して減点する。回答位置が未記録の Slider は加点しない。
     *
     * @param question 採点対象の問題テンプレート。
     * @param assignments 参加者ごとの AnswerBar 割当。
     * @param positions line ID をキーとするサーバー受理済みの X 座標。
     * @returns 参加者ごとの今回の問題における加点。
     */
    public calculate(
        question: QuestionTemplate,
        assignments: readonly AnswerBarAdded[],
        positions: ReadonlyMap<string, number>,
    ): readonly ScoreDelta[] {
        return assignments.map((assignment) => ({
            userId: assignment.ownerUserId,
            userName: assignment.ownerUserName,
            score: question.sliders.reduce((total, slider, index) => {
                const answerX = positions.get(assignment.lineIds[index] ?? "");
                if (answerX === undefined) {
                    return total;
                }
                return total + this.calculateSliderScore(slider, answerX);
            }, 0),
        }));
    }

    /**
     * 1 本の Slider に対する得点を計算する。
     *
     * @param slider 採点対象の Slider。
     * @param answerX サーバーが受理した回答バーの X 座標。
     * @returns 0 から 100 の範囲に丸めた得点。
     */
    private calculateSliderScore(slider: QuestionTemplate["sliders"][number], answerX: number): number {
        const correctX = slider.x + slider.width * slider.correctAnswerRatio;
        const maxDistance = Math.max(correctX - slider.x, slider.x + slider.width - correctX);
        if (maxDistance <= 0 || !Number.isFinite(answerX)) {
            return 0;
        }
        const distance = Math.abs(answerX - correctX);
        return Math.max(0, Math.min(100, Math.round(100 * (1 - distance / maxDistance))));
    }
}

/**
 * 参加者が 1 問で獲得した得点。
 */
type ScoreDelta = {
    userId: number;
    userName: string;
    score: number;
};

export const scoreCalculator = new ScoreCalculator();
