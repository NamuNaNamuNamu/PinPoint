import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AnswerBarAdded } from "../../../shared/answerBar/AnswerBarEvents";
import { getAnswerBarSlotRatio } from "../../../shared/answerBar/answerBarSlot";
import type { QuestionTemplate } from "../../../shared/question/QuestionTemplate";
import type { ScoreEntry } from "../../../shared/score/ScoreEvents";
import { scoreCalculator } from "./ScoreCalculator";

/**
 * ルームごとの累積得点と、サーバーが受理した回答バー X 座標を保持する。
 */
export class ScoreState {
    private readonly scoresByRoom = new Map<string, Map<number, ScoreEntry>>();
    private readonly positionsByRoom = new Map<string, Map<string, number>>();

    /**
     * 問題適用時の初期回答位置を保存し、参加者の得点エントリを準備する。
     *
     * @param roomId 対象ルーム ID。
     * @param question 適用した問題テンプレート。
     * @param assignments 問題に対して再発行した AnswerBar 割当。
     */
    public prepareQuestion(roomId: string, question: QuestionTemplate, assignments: readonly AnswerBarAdded[]): void {
        const positions = new Map<string, number>();
        assignments.forEach((assignment) => {
            question.sliders.forEach((slider, index) => {
                const lineId = assignment.lineIds[index];
                if (lineId) {
                    positions.set(lineId, slider.x + slider.width * getAnswerBarSlotRatio(assignment.slot));
                }
            });
        });
        this.positionsByRoom.set(roomId, positions);
        this.ensureEntries(roomId, assignments);
    }

    /**
     * 同期を送信したユーザー自身の AnswerBar だけから回答位置を記録する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 同期を送信したユーザー ID。
     * @param elements 同期された Excalidraw 要素。
     * @param assignments 現在の AnswerBar 割当。
     */
    public recordPositions(
        roomId: string,
        userId: number | undefined,
        elements: readonly ExcalidrawElement[],
        assignments: readonly AnswerBarAdded[],
    ): void {
        const assignment = assignments.find((candidate) => candidate.ownerUserId === userId);
        if (!assignment) {
            return;
        }
        const acceptedIds = new Set(assignment.lineIds);
        const positions = this.positionsByRoom.get(roomId) ?? new Map<string, number>();
        elements.forEach((element) => {
            if (acceptedIds.has(element.id) && !element.isDeleted && Number.isFinite(element.x)) {
                positions.set(element.id, element.x);
            }
        });
        this.positionsByRoom.set(roomId, positions);
    }

    /**
     * 現在の回答位置を採点し、今回の問題の得点を累積得点へ加算する。
     *
     * 呼び出し側は、同じ問題に対して一度だけ呼び出す責務を持つ。
     *
     * @param roomId 対象ルーム ID。
     * @param question 採点対象の問題テンプレート。
     * @param assignments 現在の AnswerBar 割当。
     * @returns 加算後の累積得点一覧。
     */
    public addQuestionScores(roomId: string, question: QuestionTemplate, assignments: readonly AnswerBarAdded[]): readonly ScoreEntry[] {
        this.ensureEntries(roomId, assignments);
        const scores = this.scoresByRoom.get(roomId)!;
        scoreCalculator.calculate(question, assignments, this.positionsByRoom.get(roomId) ?? new Map()).forEach((delta) => {
            const current = scores.get(delta.userId);
            if (current) {
                current.score += delta.score;
            }
        });
        return this.get(roomId);
    }

    /**
     * 指定ルームの累積得点を 0 にリセットする。
     *
     * @param roomId 対象ルーム ID。
     * @param assignments リセット対象として表示する AnswerBar 割当。
     * @returns リセット後の累積得点一覧。
     */
    public reset(roomId: string, assignments: readonly AnswerBarAdded[]): readonly ScoreEntry[] {
        const scores = new Map<number, ScoreEntry>();
        assignments.forEach((assignment) => {
            scores.set(assignment.ownerUserId, {
                userId: assignment.ownerUserId,
                userName: assignment.ownerUserName,
                score: 0,
            });
        });
        this.scoresByRoom.set(roomId, scores);
        return this.get(roomId);
    }

    /**
     * 指定ルームの累積得点を取得する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 現在の累積得点一覧。未作成の場合は空配列。
     */
    public get(roomId: string): readonly ScoreEntry[] {
        return [...(this.scoresByRoom.get(roomId)?.values() ?? [])];
    }

    /**
     * ルーム削除時に、その得点と回答位置を破棄する。
     *
     * @param roomId 削除されたルーム ID。
     */
    public clear(roomId: string): void {
        this.scoresByRoom.delete(roomId);
        this.positionsByRoom.delete(roomId);
    }

    private ensureEntries(roomId: string, assignments: readonly AnswerBarAdded[]): void {
        const scores = this.scoresByRoom.get(roomId) ?? new Map<number, ScoreEntry>();
        assignments.forEach((assignment) => {
            const current = scores.get(assignment.ownerUserId);
            if (current) {
                current.userName = assignment.ownerUserName;
            } else {
                scores.set(assignment.ownerUserId, {
                    userId: assignment.ownerUserId,
                    userName: assignment.ownerUserName,
                    score: 0,
                });
            }
        });
        this.scoresByRoom.set(roomId, scores);
    }
}

export const scoreState = new ScoreState();
