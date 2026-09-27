import { excalidrawAPIHolder } from "../../../../client/features/excalidraw/ExcalidrawAPIHolder";
import { ElementCommon } from "../../ElementCommon";

/**
 * 移動可能なExcalidraw線要素を管理し、指定範囲外への移動や高さの変更を制限する。
 */
export class Line {
    private readonly elementCommon;
    private readonly moveRange: MoveRange;
    private previousElement: any;

    /**
     * @param params 線要素のスケルトンと移動可能範囲
     */
    constructor({ skeleton, moveRange }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
        this.moveRange = moveRange;
        this.previousElement = null;
    }

    private getExcalidrawElement() {
        return this.elementCommon.getExcalidrawElement();
    }

    /**
     * @returns 線要素を生成するためのスケルトン
     */
    getSkeleton() {
        return this.elementCommon.getSkeleton();
    }

    /**
     * @returns 線要素のID
     */
    getId() {
        return this.elementCommon.getId();
    }

    private getX() {
        return this.getExcalidrawElement().x;
    }

    private setX(x: number) {
        const api = excalidrawAPIHolder.getApi();
        const elements = api.getSceneElements();

        api.updateScene({
            elements: elements.map((el) =>
                el.id === this.getId()
                    ? {
                          ...el,
                          x: x,
                      }
                    : el,
            ),
        });
    }

    private getY() {
        return this.getExcalidrawElement().y;
    }

    private setY(y: number) {
        const api = excalidrawAPIHolder.getApi();
        const elements = api.getSceneElements();

        api.updateScene({
            elements: elements.map((el) =>
                el.id === this.getId()
                    ? {
                          ...el,
                          y: y,
                      }
                    : el,
            ),
        });
    }

    private getHeight() {
        return this.getExcalidrawElement().height;
    }

    private cancelChange() {
        const api = excalidrawAPIHolder.getApi();
        const elements = api.getSceneElements();

        api.updateScene({
            elements: elements.map((el) =>
                el.id === this.getId()
                    ? {
                          ...this.previousElement,
                      }
                    : el,
            ),
        });
    }

    /**
     * 線要素の変更時の挙動を定義する。移動以外（拡大など）を無効化し、移動に関しても移動範囲を限定する
     */
    onChange(): void {
        if (this.previousElement) {
            if (this.getHeight() !== this.previousElement.height) {
                this.cancelChange();
            }
        }

        if (this.getX() < this.moveRange.minX) {
            this.setX(this.moveRange.minX);
        }

        if (this.getX() > this.moveRange.maxX) {
            this.setX(this.moveRange.maxX);
        }

        if (this.getY() < this.moveRange.minY) {
            this.setY(this.moveRange.minY);
        }

        if (this.getY() > this.moveRange.maxY) {
            this.setY(this.moveRange.maxY);
        }

        // cancelChange() 用
        this.previousElement = structuredClone(this.getExcalidrawElement());
    }
}

interface Params {
    skeleton: any;
    moveRange: MoveRange;
}

interface MoveRange {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}
