import { ElementCommon } from "../../ElementCommon";

/**
 * Excalidrawの長方形要素を扱う。
 */
export class Rectangle {
    private readonly elementCommon;

    /**
     * @param params 長方形要素のスケルトン
     */
    constructor({ skeleton }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
    }

    /**
     * @returns 長方形要素を生成するためのスケルトン
     */
    getSkeleton() {
        return this.elementCommon.getSkeleton();
    }

    /**
     * @returns 長方形要素のID
     */
    getId() {
        return this.elementCommon.getId();
    }
}

interface Params {
    skeleton: any;
}
