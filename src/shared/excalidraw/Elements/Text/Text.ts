import { ElementCommon } from "../../ElementCommon";

/**
 * Excalidrawのテキスト要素を扱う。
 */
export class Text {
    private readonly elementCommon;

    /**
     * @param params テキスト要素のスケルトン
     */
    constructor({ skeleton }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
    }

    /**
     * @returns テキスト要素を生成するためのスケルトン
     */
    getSkeleton() {
        return this.elementCommon.getSkeleton();
    }

    /**
     * @returns テキスト要素のID
     */
    getId() {
        return this.elementCommon.getId();
    }
}

interface Params {
    skeleton: any;
}
