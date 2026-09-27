import { excalidrawAPIHolder } from "../../client/features/excalidraw/ExcalidrawAPIHolder";

/**
 * Excalidraw要素のスケルトンと、シーン上の対応要素を扱う共通処理を提供する。
 */
export class ElementCommon {
    private readonly skeleton;

    /**
     * @param params 要素スケルトン
     */
    constructor({ skeleton }: Params) {
        this.skeleton = skeleton;
    }

    /**
     * スケルトンのIDに対応する、現在のシーン上のExcalidraw要素を取得する。
     *
     * @returns シーン上のExcalidraw要素
     * @throws 対応する要素がシーンに存在しない場合
     */
    getExcalidrawElement() {
        const api = excalidrawAPIHolder.getApi();

        const element = api
            .getSceneElements()
            .find(e => e.id === this.getId());

        if (!element) {
            throw new Error("Excalidraw 要素が見つかりませんでした");
        }

        return element;
    }

    /**
     * @returns この要素を生成するためのスケルトン
     */
    getSkeleton() {
        return this.skeleton;
    }

    /**
     * @returns スケルトンに設定された要素ID
     */
    getId() {
        return this.skeleton.id;
    }
}

interface Params {
    skeleton: any;
}
