import { ElementCommon } from "../../ElementCommon";

/**
 * Excalidraw のテキスト要素を管理する。
 */
export class Text {
    /**
     * Excalidraw 要素に共通する操作を提供するオブジェクト。
     */
    private readonly elementCommon;

    /**
     * テキスト要素を初期化する。
     *
     * @param params テキスト要素のスケルトン。
     */
    constructor({ skeleton }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
    }

    /**
     * テキスト要素を生成するためのスケルトンを取得する。
     *
     * @returns テキスト要素のスケルトン。
     */
    getSkeleton() {
        return this.elementCommon.getSkeleton();
    }

    /**
     * テキスト要素の ID を取得する。
     *
     * @returns テキスト要素の ID。
     */
    getId() {
        return this.elementCommon.getId();
    }
}

/**
 * テキスト要素の生成に必要なパラメータ。
 */
interface Params {
    /**
     * テキスト要素のスケルトン。
     */
    skeleton: any;
}
