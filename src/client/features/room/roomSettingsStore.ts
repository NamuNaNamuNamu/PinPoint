import { useSyncExternalStore } from "react";

type RoomSettings = { cursorRevealed: boolean; answerBarReveal: boolean };

class RoomSettingsStore {
    private snapshot: RoomSettings = { cursorRevealed: true, answerBarReveal: true };
    private readonly listeners = new Set<() => void>();

    public getSnapshot = (): RoomSettings => this.snapshot;
    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };
    /**
     * 共有カーソルの公開状態を反映する。
     *
     * @param cursorRevealed 共有カーソルを公開する場合は `true`。
     */
    public setCursorRevealed(cursorRevealed: boolean): void {
        this.set({ ...this.snapshot, cursorRevealed });
    }
    /**
     * 他チーム AnswerBar の公開状態を反映する。
     *
     * @param answerBarReveal 他チームの AnswerBar を公開する場合は `true`。
     */
    public setAnswerBarReveal(answerBarReveal: boolean): void {
        this.set({ ...this.snapshot, answerBarReveal });
    }
    /**
     * 購読者へ通知が必要な場合だけ、設定 snapshot を置き換える。
     *
     * @param snapshot 更新候補のルーム設定。
     */
    private set(snapshot: RoomSettings): void {
        if (snapshot.cursorRevealed === this.snapshot.cursorRevealed && snapshot.answerBarReveal === this.snapshot.answerBarReveal) return;
        this.snapshot = snapshot;
        this.listeners.forEach((listener) => listener());
    }
}

export const roomSettingsStore = new RoomSettingsStore();
export function useRoomSettings(): RoomSettings {
    return useSyncExternalStore(roomSettingsStore.subscribe, roomSettingsStore.getSnapshot);
}
