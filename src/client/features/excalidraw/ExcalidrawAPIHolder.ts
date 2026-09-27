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
}

export const excalidrawAPIHolder = new ExcalidrawAPIHolder();
