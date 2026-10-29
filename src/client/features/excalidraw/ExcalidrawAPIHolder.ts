import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

// Note: ExcalidrawAPI が参照するのが大変なので作った。

/**
 * Excalidraw の Imperative API を保持し、アプリケーション内から取得できるようにする。
 */
class ExcalidrawAPIHolder {
    private api: ExcalidrawImperativeAPI | null;

    constructor() {
        this.api = null;
    }

    /**
     * Excalidraw の Imperative API を設定する。
     *
     * @param api 設定する API。未設定にする場合は `null`。
     */
    public setApi(api: ExcalidrawImperativeAPI | null) {
        this.api = api;
    }

    /**
     * 設定済みの Excalidraw の Imperative API を取得する。
     *
     * @returns 設定済みの Excalidraw API。
     * @throws API が未設定の場合にエラーを送出する。
     */
    public getApi(): ExcalidrawImperativeAPI {
        if (!this.api) {
            throw new Error("ExcalidrawAPI が未設定です");
        }

        return this.api;
    }

    /**
     * 削除済み要素を除いた、現在操作可能な scene 要素を取得する。
     *
     * @returns 削除済み要素を含まない scene 要素。
     */
    public getActiveSceneElements() {
        return this.getApi().getSceneElements();
    }

    /**
     * 削除済み要素を含む、同期用の scene 要素を取得する。
     *
     * @returns tombstone を含む scene 要素。
     */
    public getSceneElementsWithTombstones() {
        return this.getApi().getSceneElementsIncludingDeleted();
    }

    /**
     * 現在操作可能な scene 要素から、指定 ID の要素を取得する。
     *
     * @param id 取得する要素の ID。
     * @returns 指定 ID の要素。存在しない場合は `undefined`。
     */
    public findActiveElementById(id: string) {
        return this.getActiveSceneElements().find((element) => element.id === id);
    }
}

export const excalidrawAPIHolder = new ExcalidrawAPIHolder();
