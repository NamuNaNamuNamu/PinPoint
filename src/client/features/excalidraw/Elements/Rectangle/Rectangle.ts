import { ElementCommon } from "../ElementCommon";

/**
 * Excalidraw の長方形要素を管理する。
 */
export class Rectangle {
    /** Excalidraw 要素に共通する操作を提供するオブジェクト。 */
    private readonly elementCommon;

    /**
     * 長方形要素を初期化する。
     *
     * @param params 長方形要素のスケルトン。
     */
    constructor({ skeleton }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
    }

    /**
     * 長方形要素を生成するためのスケルトンを取得する。
     *
     * @returns 長方形要素のスケルトン。
     */
    getSkeleton() {
        return this.elementCommon.getSkeleton();
    }

    /**
     * 長方形要素の ID を取得する。
     *
     * @returns 長方形要素の ID。
     */
    getId() {
        return this.elementCommon.getId();
    }
}

/**
 * 長方形要素の生成に必要なパラメータ。
 */
interface Params {
    /**
     * 長方形要素のスケルトン。
     */
    skeleton: any;
}
