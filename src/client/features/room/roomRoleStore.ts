import { useSyncExternalStore } from "react";

/**
 * 現在のルームにおける作成者ロールを UI へ配信する。
 */
class RoomRoleStore {
    private isCreator = false;
    private readonly listeners = new Set<() => void>();

    /**
     * 現在の作成者ロールを React の外部ストアスナップショットとして返す。
     *
     * @returns 現在のクライアントが作成者の場合は `true`。
     */
    public getSnapshot = (): boolean => this.isCreator;

    /**
     * 作成者ロールの変更を通知するリスナーを登録する。
     *
     * @param listener ロール変更時に呼び出す関数。
     * @returns 登録を解除する関数。
     */
    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    /**
     * 作成者ロールを更新し、値が変わった場合だけ購読者へ通知する。
     *
     * @param isCreator 更新後の作成者ロール。
     */
    public set(isCreator: boolean): void {
        if (this.isCreator === isCreator) return;
        this.isCreator = isCreator;
        this.listeners.forEach((listener) => listener());
    }
}

export const roomRoleStore = new RoomRoleStore();

/**
 * 現在のクライアントが現在のルームの作成者かを React state として取得する。
 *
 * @returns 現在のクライアントが作成者の場合は `true`。
 */
export function useIsRoomCreator(): boolean {
    return useSyncExternalStore(roomRoleStore.subscribe, roomRoleStore.getSnapshot);
}
