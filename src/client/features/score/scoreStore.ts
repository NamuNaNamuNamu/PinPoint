import type { ScoreEntry, ScoresUpdated } from "../../../shared/score/ScoreEvents";

/**
 * Socket 通知を React UI へ配信する、クライアント側の得点状態。
 */
class ScoreStore {
    private scores: readonly ScoreEntry[] = [];
    private readonly listeners = new Set<() => void>();
    /**
     * React の外部 store 購読用に現在の得点一覧を取得する。
     *
     * @returns 現在保持している累積得点一覧。
     */
    public getSnapshot = (): readonly ScoreEntry[] => this.scores;

    /**
     * 得点更新を通知するリスナーを登録する。
     *
     * @param listener 得点スナップショット更新時に実行する関数。
     * @returns 登録を解除する関数。
     */
    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };
    /**
     * サーバーから受信した得点スナップショットを保存して購読者へ通知する。
     *
     * @param payload サーバーが配信した得点一覧。
     */
    public set(payload: ScoresUpdated): void {
        this.scores = payload.scores;
        this.listeners.forEach((listener) => listener());
    }
}

export const scoreStore = new ScoreStore();
