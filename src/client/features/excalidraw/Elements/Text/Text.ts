import { newElementWith } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { excalidrawAPIHolder } from "../../ExcalidrawAPIHolder";
import { ElementCommon } from "../ElementCommon";

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

    /**
     * 生成済み要素の外枠中心が指定座標になるよう、テキスト要素の左上座標を補正する。
     *
     * @param elements Excalidraw への変換後の要素。
     * @param centerX 外枠中心の X 座標。
     * @param centerY 外枠中心の Y 座標。
     * @returns 対象テキストの座標を補正した要素。
     */
    public centerInElements(
        elements: readonly OrderedExcalidrawElement[],
        centerX: number,
        centerY: number,
    ): OrderedExcalidrawElement[] {
        return elements.map((element) => {
            if (element.id !== this.getId()) {
                return element;
            }

            return {
                ...element,
                x: centerX - element.width / 2,
                y: centerY - element.height / 2,
            };
        });
    }

    /**
     * 指定座標が外枠中心となるよう、scene 上のテキストを移動する。
     *
     * @param centerX 外枠中心の X 座標。
     * @param centerY 外枠中心の Y 座標。
     */
    public setCenterPosition(centerX: number, centerY: number): void {
        const text = excalidrawAPIHolder.findActiveElementById(this.getId());

        if (!text) {
            return;
        }

        this.setPosition(centerX - text.width / 2, centerY - text.height / 2);
    }

    /**
     * テキスト要素を指定座標へ移動する。
     *
     * 現在の座標と指定座標が同じ場合は、不要なシーン更新を行わない。
     *
     * @param x 移動後の X 座標。
     * @param y 移動後の Y 座標。
     */
    public setPosition(x: number, y: number): void {
        const api = excalidrawAPIHolder.getApi();
        const elements = excalidrawAPIHolder.getSceneElementsWithTombstones();
        const text = elements.find((element) => element.id === this.getId());

        if (!text || (text.x === x && text.y === y)) {
            return;
        }

        api.updateScene({
            elements: elements.map((element) =>
                element.id === this.getId() ? newElementWith(element, { x, y }) : element,
            ),
        });
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
