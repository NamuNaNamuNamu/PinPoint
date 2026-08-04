import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";


// Note: ExcalidrawAPI が参照するのが大変なので作った。
class ExcalidrawAPIHolder {
    private api: ExcalidrawImperativeAPI | null;

    constructor() {
        this.api = null;
    }

    public setApi(api: ExcalidrawImperativeAPI | null) {
        this.api = api;
    }

    // とりあえず api を返すだけ
    public getApi(): ExcalidrawImperativeAPI {
        if (!this.api) {
            throw new Error("ExcalidrawAPI が未設定です");
        }

        return this.api;
    }
}

export const excalidrawAPIHolder = new ExcalidrawAPIHolder();