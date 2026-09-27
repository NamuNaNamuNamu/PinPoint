import { excalidrawAPIHolder } from "../../../../client/features/excalidraw/ExcalidrawAPIHolder";
import { ElementCommon } from "../../ElementCommon";

/**
 * 移動可能なExcalidraw線要素を管理し、指定範囲外への移動や高さの変更を制限する。
 *
 * 線の形状変更を取り消し、指定された範囲内に移動を制限する。
 */
export class Line {
    /** Excalidraw 要素に共通する操作を提供するオブジェクト。 */
    private readonly elementCommon;

    /** 線要素を移動できる座標範囲。 */
    private readonly moveRange: MoveRange;

    /** 直前の Excalidraw 要素の状態。形状変更を取り消す際に使用する。 */
    private previousElement: any;

    /**
     * 線要素を初期化する。
     *
     * @param params 線のスケルトンと移動可能範囲。
     */
    constructor({ skeleton, moveRange }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
        this.moveRange = moveRange;
        this.previousElement = null;
    }

    /**
     * 対応する Excalidraw 要素を取得する。
     *
     * @returns Excalidraw のシーンに配置されている線要素。
     */
    private getExcalidrawElement() {
        return this.elementCommon.getExcalidrawElement();
    }

    /**
     * 線要素を生成するためのスケルトンを取得する。
     *
     * @returns 線要素のスケルトン。
     */
    getSkeleton() {
        return this.elementCommon.getSkeleton();
    }

    /**
     * 線要素の ID を取得する。
     *
     * @returns 線要素の ID。
     */
    getId() {
        return this.elementCommon.getId();
    }

    /**
     * 線要素の X 座標を取得する。
     *
     * @returns 線要素の X 座標。
     */
    private getX() {
        return this.getExcalidrawElement().x;
    }

    /**
     * 線要素の X 座標を更新する。
     *
     * @param x 更新後の X 座標。
     */
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

    /**
     * 線要素の Y 座標を取得する。
     *
     * @returns 線要素の Y 座標。
     */
    private getY() {
        return this.getExcalidrawElement().y;
    }

    /**
     * 線要素の Y 座標を更新する。
     *
     * @param y 更新後の Y 座標。
     */
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

    /**
     * 線要素の高さを取得する。
     *
     * @returns 線要素の高さ。
     */
    private getHeight() {
        return this.getExcalidrawElement().height;
    }

    /**
     * 直前に保存した状態へ線要素を戻す。
     */
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
        // 移動以外の変更を無効化
        if (this.previousElement) {
            if (this.getHeight() !== this.previousElement.height) {
                this.cancelChange();
            }
        }

        // 移動制限
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

/** 線要素の生成に必要なパラメータ。 */
interface Params {
    /** 線要素のスケルトン。 */
    skeleton: any;

    /** 線要素を移動できる座標範囲。 */
    moveRange: MoveRange;
}

/** 線要素を移動できる座標の最小値と最大値。 */
interface MoveRange {
    /** 移動可能な X 座標の最小値。 */
    minX: number;

    /** 移動可能な X 座標の最大値。 */
    maxX: number;

    /** 移動可能な Y 座標の最小値。 */
    minY: number;

    /** 移動可能な Y 座標の最大値。 */
    maxY: number;
}
