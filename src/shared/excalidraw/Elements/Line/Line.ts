import { excalidrawAPIHolder } from "../../../../client/features/excalidraw/ExcalidrawAPIHolder";
import { ElementCommon } from "../../ElementCommon";
import type { MoveRange } from "./MoveRange";

/**
 * 移動可能な Excalidraw 線要素を管理し、指定範囲外への移動や高さの変更を制限する。
 *
 * 線の形状変更を取り消し、指定された範囲内への移動だけを許可する。
 */
export class Line {
    /**
     * Excalidraw 要素に共通する操作を提供するオブジェクト。
     */
    private readonly elementCommon;
    /**
     * 線要素を移動できる座標範囲。
     */
    private readonly moveRange: MoveRange;
    /**
     * 直前の Excalidraw 要素の状態。形状変更を取り消す際に使用する。
     */
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
     * Excalidraw のシーンに配置されている線要素を取得する。
     *
     * @returns Excalidraw のシーンに配置されている線要素。
     */
    private getExcalidrawElement() {
        return this.elementCommon.getExcalidrawElement();
    }

    /**
     * 線要素を生成するためのスケルトンを取得する。
     *
     * @returns 線要素を生成するためのスケルトン。
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
     * 線要素の Y 座標を取得する。
     *
     * @returns 線要素の Y 座標。
     */
    private getY() {
        return this.getExcalidrawElement().y;
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
     * 線要素の X 座標を更新する。
     *
     * @param x 更新後の X 座標。
     */
    private setX(x: number) {
        this.updateCoordinate("x", x);
    }

    /**
     * 線要素の Y 座標を更新する。
     *
     * @param y 更新後の Y 座標。
     */
    private setY(y: number) {
        this.updateCoordinate("y", y);
    }

    /**
     * 線要素の指定座標を更新する。
     *
     * @param coordinate 更新する座標軸。
     * @param value 更新後の座標値。
     */
    private updateCoordinate(coordinate: "x" | "y", value: number) {
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: api
                .getSceneElements()
                .map((el) => (el.id === this.getId() ? { ...el, [coordinate]: value } : el)),
        });
    }

    /**
     * 直前に保存した状態へ線要素を戻す。
     */
    private cancelChange() {
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: api.getSceneElements().map((el) => (el.id === this.getId() ? { ...this.previousElement } : el)),
        });
    }

    /**
     * 線要素の変更を検証し、形状変更の取り消しと移動範囲の制限を行う。
     */
    public onChange(): void {
        if (this.previousElement && this.getHeight() !== this.previousElement.height) {
            this.cancelChange();
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
        this.previousElement = structuredClone(this.getExcalidrawElement());
    }
}

/**
 * 線要素の生成に必要なパラメータ。
 */
interface Params {
    /**
     * 線要素のスケルトン。
     */
    skeleton: any;
    /**
     * 線要素を移動できる座標範囲。
     */
    moveRange: MoveRange;
}
