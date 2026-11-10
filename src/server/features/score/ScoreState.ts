import type { AnswerBarAdded } from "../../../shared/answerBar/AnswerBarEvents";
import type { QuestionTemplate } from "../../../shared/question/QuestionTemplate";
import type { ScoreEntry } from "../../../shared/score/ScoreEvents";
import { scoreCalculator } from "./ScoreCalculator";

/**
 * ルームごとの累積得点を保持する。
 */
export class ScoreState {
    private readonly scoresByRoom = new Map<string, Map<number, ScoreEntry>>();
    private readonly activeUserIdsByRoom = new Map<string, Set<number>>();
    private readonly questionScoresByRoom = new Map<string, Map<number, Map<number, number>>>();
    private readonly resetRooms = new Set<string>();

    /**
     * 得点一覧の参加者としてユーザーを追加する。
     *
     * 過去に参加したユーザーは保持済みの累積得点を再利用し、初参加者だけを 0 点で作成する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 参加するユーザー ID。
     * @param userName 得点一覧に表示するユーザー名。
     * @returns 表示対象または表示名が変化した場合は `true`。
     */
    public addParticipant(roomId: string, userId: number, userName: string): boolean {
        const scores = this.getScores(roomId);
        const current = scores.get(userId);
        const userNameUpdated = current !== undefined && current.userName !== userName;
        if (current) {
            current.userName = userName;
        } else {
            scores.set(userId, { userId, userName, score: 0 });
        }
        const activeUserIds = this.getActiveUserIds(roomId);
        const wasActive = activeUserIds.has(userId);
        activeUserIds.add(userId);
        return !wasActive || userNameUpdated;
    }

    /**
     * 得点一覧の表示対象からユーザーを除外する。累積得点は再参加時に復元できるよう削除しない。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 退出するユーザー ID。
     * @returns 表示対象が変化した場合は `true`。
     */
    public removeParticipant(roomId: string, userId: number): boolean {
        return this.activeUserIdsByRoom.get(roomId)?.delete(userId) ?? false;
    }

    /**
     * 得点一覧に保存済みの参加者名を更新する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 更新するユーザー ID。
     * @param userName 更新後のユーザー名。
     * @returns 表示名が変化した場合は `true`。
     */
    public updateParticipantName(roomId: string, userId: number, userName: string): boolean {
        const current = this.scoresByRoom.get(roomId)?.get(userId);
        if (!current || current.userName === userName) {
            return false;
        }
        current.userName = userName;
        return true;
    }

    /**
     * 現在の回答位置を採点し、今回の問題の得点を累積得点へ加算する。
     *
     * 呼び出し側は、同じ問題に対して一度だけ呼び出す責務を持つ。
     *
     * @param roomId 対象ルーム ID。
     * @param question 採点対象の問題テンプレート。
     * @param assignments 現在の AnswerBar 割当。
     * @param positionsByLineId AnswerBarAssignmentState が保持する読み取り専用の回答位置。
     * @returns 加算後の累積得点一覧。
     */
    public addQuestionScores(
        roomId: string,
        question: QuestionTemplate,
        assignments: readonly AnswerBarAdded[],
        positionsByLineId: ReadonlyMap<string, number>,
    ): readonly ScoreEntry[] {
        this.resetRooms.delete(roomId);
        this.ensureEntries(roomId, assignments);
        const scores = this.scoresByRoom.get(roomId)!;
        const questionScores = this.getQuestionScores(roomId, question.id);
        scoreCalculator.calculate(question, assignments, positionsByLineId).forEach((delta) => {
            const current = scores.get(delta.userId);
            if (current) {
                current.score += delta.score;
                questionScores.set(delta.userId, delta.score);
            }
        });
        return this.get(roomId);
    }

    /**
     * 公開後に復帰した回答者の今回問題の得点を差し替える。
     *
     * 得点リセット後は reset の server 状態を正とし、変更しない。
     *
     * @param roomId 対象ルーム ID。
     * @param question 採点対象の問題。
     * @param assignment 復帰した回答者の AnswerBar 割当。
     * @param positionsByLineId サーバー受理済みの回答位置。
     * @returns 補正後の累積得点一覧。
     */
    public replaceQuestionScore(
        roomId: string,
        question: QuestionTemplate,
        assignment: AnswerBarAdded,
        positionsByLineId: ReadonlyMap<string, number>,
    ): readonly ScoreEntry[] {
        if (this.resetRooms.has(roomId)) return this.get(roomId);
        this.ensureEntries(roomId, [assignment]);
        const next = scoreCalculator.calculate(question, [assignment], positionsByLineId)[0]?.score ?? 0;
        const questionScores = this.getQuestionScores(roomId, question.id);
        const previous = questionScores.get(assignment.ownerUserId) ?? 0;
        const entry = this.getScores(roomId).get(assignment.ownerUserId);
        if (entry) entry.score += next - previous;
        questionScores.set(assignment.ownerUserId, next);
        return this.get(roomId);
    }

    /**
     * 指定ルームの累積得点を 0 にリセットする。
     *
     * @param roomId 対象ルーム ID。
     * @returns リセット後の累積得点一覧。
     */
    public reset(roomId: string): readonly ScoreEntry[] {
        this.scoresByRoom.get(roomId)?.forEach((entry) => {
            entry.score = 0;
        });
        this.questionScoresByRoom.delete(roomId);
        this.resetRooms.add(roomId);
        return this.get(roomId);
    }

    /**
     * 指定ルームの累積得点を取得する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 現在の累積得点一覧。未作成の場合は空配列。
     */
    public get(roomId: string): readonly ScoreEntry[] {
        const activeUserIds = this.activeUserIdsByRoom.get(roomId);
        return activeUserIds
            ? [...(this.scoresByRoom.get(roomId)?.values() ?? [])].filter((entry) => activeUserIds.has(entry.userId))
            : [];
    }

    /**
     * ルーム削除時に、その得点を破棄する。
     *
     * @param roomId 削除されたルーム ID。
     */
    public clear(roomId: string): void {
        this.scoresByRoom.delete(roomId);
        this.activeUserIdsByRoom.delete(roomId);
        this.questionScoresByRoom.delete(roomId);
        this.resetRooms.delete(roomId);
    }

    private ensureEntries(roomId: string, assignments: readonly AnswerBarAdded[]): void {
        const scores = this.getScores(roomId);
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
    }

    private getScores(roomId: string): Map<number, ScoreEntry> {
        const scores = this.scoresByRoom.get(roomId) ?? new Map<number, ScoreEntry>();
        this.scoresByRoom.set(roomId, scores);
        return scores;
    }

    private getActiveUserIds(roomId: string): Set<number> {
        const activeUserIds = this.activeUserIdsByRoom.get(roomId) ?? new Set<number>();
        this.activeUserIdsByRoom.set(roomId, activeUserIds);
        return activeUserIds;
    }

    private getQuestionScores(roomId: string, questionId: number): Map<number, number> {
        const byQuestion = this.questionScoresByRoom.get(roomId) ?? new Map<number, Map<number, number>>();
        this.questionScoresByRoom.set(roomId, byQuestion);
        const scores = byQuestion.get(questionId) ?? new Map<number, number>();
        byQuestion.set(questionId, scores);
        return scores;
    }
}

export const scoreState = new ScoreState();
