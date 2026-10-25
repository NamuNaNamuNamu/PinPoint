import { convertToExcalidrawElements, newElementWith } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

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
        const positionedElement = this.getCenteredElement(centerX, centerY);
        if (!positionedElement?.isUpdated) {
            return;
        }

        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: excalidrawAPIHolder
                .getSceneElementsWithTombstones()
                .map((element) => (element.id === this.getId() ? positionedElement.element : element)),
        });
    }

    /**
     * 指定座標が外枠中心となるようにしたテキスト要素を返す。
     *
     * scene を更新しないため、AnswerBar の線要素の補正と名前ラベルの追従を
     * 同一の scene 更新へまとめる場合に使用する。
     *
     * @param centerX 外枠中心の X 座標。
     * @param centerY 外枠中心の Y 座標。
     * @returns 位置補正後の要素と、scene 更新が必要かどうか。対象が存在しない場合は `undefined`。
     */
    public getCenteredElement(centerX: number, centerY: number): PositionedTextElement | undefined {
        const text = excalidrawAPIHolder.findActiveElementById(this.getId());
        if (!text) {
            return undefined;
        }

        const x = centerX - text.width / 2;
        const y = centerY - text.height / 2;
        if (text.x === x && text.y === y) {
            return { element: text, isUpdated: false };
        }

        return { element: newElementWith(text, { x, y }), isUpdated: true };
    }

    /**
     * scene 上のテキスト内容を更新する。
     *
     * @param value 更新後のテキスト内容。
     */
    public setText(value: string): void {
        const api = excalidrawAPIHolder.getApi();
        const elements = excalidrawAPIHolder.getSceneElementsWithTombstones();
        const text = excalidrawAPIHolder.findActiveElementById(this.getId());

        if (!text || text.type !== "text" || text.text === value) {
            return;
        }

        const [regeneratedText] = convertToExcalidrawElements([{ ...this.getSkeleton(), text: value }], {
            regenerateIds: false,
        });

        if (!regeneratedText || regeneratedText.type !== "text") {
            return;
        }

        const centerX = text.x + text.width / 2;
        const centerY = text.y + text.height / 2;
        api.updateScene({
            elements: elements.map((element) => {
                if (element.id !== this.getId() || element.type !== "text") {
                    return element;
                }

                return newElementWith(element, {
                    text: value,
                    originalText: value,
                    width: regeneratedText.width,
                    height: regeneratedText.height,
                    x: centerX - regeneratedText.width / 2,
                    y: centerY - regeneratedText.height / 2,
                });
            }),
        });
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

/** テキスト要素の位置補正結果。 */
interface PositionedTextElement {
    /** 位置補正後のテキスト要素。 */
    element: ExcalidrawElement;
    /** scene へ反映する変更がある場合は `true`。 */
    isUpdated: boolean;
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
