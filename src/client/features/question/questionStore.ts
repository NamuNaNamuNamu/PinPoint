import { useSyncExternalStore } from "react";

/**
 * 現在問題の有無を React UI へ通知するための最小状態。
 */
class QuestionStore {
    private hasCurrentQuestion = false;
    private readonly listeners = new Set<() => void>();

    /**
     * 現在問題が存在するかを取得する。
     *
     * @returns 現在問題がある場合は `true`。
     */
    public getSnapshot = (): boolean => this.hasCurrentQuestion;

    /**
     * 現在問題の状態変化を購読する。
     *
     * @param listener 状態変化時に呼び出す関数。
     * @returns 購読解除関数。
     */
    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    /**
     * 現在問題の有無を更新する。
     *
     * @param hasCurrentQuestion 更新後の現在問題の有無。
     */
    public set(hasCurrentQuestion: boolean): void {
        if (this.hasCurrentQuestion === hasCurrentQuestion) {
            return;
        }
        this.hasCurrentQuestion = hasCurrentQuestion;
        this.listeners.forEach((listener) => listener());
    }
}

export const questionStore = new QuestionStore();

/**
 * 現在問題の有無を購読する。
 *
 * @returns 現在問題がある場合は `true`。
 */
export function useHasCurrentQuestion(): boolean {
    return useSyncExternalStore(questionStore.subscribe, questionStore.getSnapshot);
}
