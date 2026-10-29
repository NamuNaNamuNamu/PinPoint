import { useSyncExternalStore } from "react";

/** 得点一覧の有効状態を React UI へ配信する。 */
class ScoreListStore {
    private enabled = true;
    private readonly listeners = new Set<() => void>();

    /** @returns 得点一覧が有効な場合は `true`。 */
    public getSnapshot = (): boolean => this.enabled;

    /**
     * 状態変化を購読する。
     *
     * @param listener 状態変化時に実行する関数。
     * @returns 購読解除関数。
     */
    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    /**
     * サーバー通知による有効状態を反映する。
     *
     * @param enabled 更新後の有効状態。
     */
    public set(enabled: boolean): void {
        if (this.enabled === enabled) {
            return;
        }
        this.enabled = enabled;
        this.listeners.forEach((listener) => listener());
    }
}

export const scoreListStore = new ScoreListStore();

/** @returns 得点一覧が有効な場合は `true`。 */
export function useScoreListEnabled(): boolean {
    return useSyncExternalStore(scoreListStore.subscribe, scoreListStore.getSnapshot);
}
