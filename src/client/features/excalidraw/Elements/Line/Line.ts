import { newElementWith } from "@excalidraw/excalidraw";
import type { ExcalidrawLinearElement } from "@excalidraw/excalidraw/element/types";

import { excalidrawAPIHolder } from "../../ExcalidrawAPIHolder";
import { ElementCommon } from "../ElementCommon";
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
    private previousElement: ExcalidrawLinearElement | null;

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
    private getExcalidrawElement(): ExcalidrawLinearElement {
        const element = this.elementCommon.getExcalidrawElement();
        if (element.type !== "line") {
            throw new Error("Excalidraw の線要素が見つかりませんでした");
        }

        return element;
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
     * 線要素を検証し、回答バーとして許可する状態へ正規化した要素を返す。
     *
     * 現在の要素を基に必要なプロパティだけを更新するため、ドラッグ中の要素を
     * 過去のスナップショット全体で置き換えない。
     *
     * @returns 正規化後の線要素と、scene 更新が必要かどうか。
     */
    public getNormalizedElement(): NormalizedLineElement {
        const current = this.getExcalidrawElement();
        const changes = this.getNormalizationChanges(current);
        const isUpdated = Object.keys(changes).length > 0;
        const element = isUpdated ? newElementWith(current, changes) : current;
        this.previousElement = structuredClone(element);

        return { element, isUpdated };
    }

    /**
     * 線要素の変更を検証し、必要な正規化を scene へ反映する。
     *
     * AnswerBar では複数要素を一度に反映するため `getNormalizedElement()` を使用する。
     */
    public onChange(): void {
        const normalizedElement = this.getNormalizedElement();
        if (!normalizedElement.isUpdated) {
            return;
        }

        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: excalidrawAPIHolder
                .getSceneElementsWithTombstones()
                .map((element) => (element.id === this.getId() ? normalizedElement.element : element)),
        });
    }

    /**
     * 回答バーで許可していないプロパティが変更されたかを判定する。
     *
     * AnswerBar で利用する Line は、水平位置を表す `x` だけ変更可能である。
     * Excalidraw の同期用 version 情報は比較対象に含めない。
     *
     * @returns `x` 以外の表示または形状プロパティが変更された場合は `true`。
     */
    private hasUnexpectedChange(current: ExcalidrawLinearElement, previousElement: ExcalidrawLinearElement): boolean {
        return ANSWER_BAR_FIXED_PROPERTIES.some(
            (property) => JSON.stringify(current[property]) !== JSON.stringify(previousElement[property]),
        );
    }

    /**
     * 現在の線要素を AnswerBar の不変条件と移動範囲へ戻すための差分を取得する。
     *
     * @param current scene 上の現在の線要素。
     * @returns 現在の線要素に適用する最小限の差分。
     */
    private getNormalizationChanges(current: ExcalidrawLinearElement): NormalizationChanges {
        const previousElement = this.previousElement;
        const changes: NormalizationChanges = {};

        if (previousElement && this.hasUnexpectedChange(current, previousElement)) {
            changes.y = previousElement.y;
            changes.width = previousElement.width;
            changes.height = previousElement.height;
            changes.angle = previousElement.angle;
            changes.points = previousElement.points;
            changes.strokeColor = previousElement.strokeColor;
            changes.backgroundColor = previousElement.backgroundColor;
            changes.fillStyle = previousElement.fillStyle;
            changes.strokeWidth = previousElement.strokeWidth;
            changes.strokeStyle = previousElement.strokeStyle;
            changes.roughness = previousElement.roughness;
            changes.opacity = previousElement.opacity;
            changes.startArrowhead = previousElement.startArrowhead;
            changes.endArrowhead = previousElement.endArrowhead;
        }

        const x = Math.min(Math.max(current.x, this.moveRange.minX), this.moveRange.maxX);
        const y = Math.min(Math.max(current.y, this.moveRange.minY), this.moveRange.maxY);
        if (x !== current.x) {
            changes.x = x;
        }
        if (y !== current.y) {
            changes.y = y;
        }

        return changes;
    }
}

/** 線要素の正規化結果。 */
interface NormalizedLineElement {
    /** 正規化後の線要素。 */
    element: ExcalidrawLinearElement;
    /** scene へ反映する変更がある場合は `true`。 */
    isUpdated: boolean;
}

/** AnswerBar の移動以外で固定する Excalidraw Line プロパティ。 */
const ANSWER_BAR_FIXED_PROPERTIES = [
    "y",
    "width",
    "height",
    "angle",
    "points",
    "strokeColor",
    "backgroundColor",
    "fillStyle",
    "strokeWidth",
    "strokeStyle",
    "roughness",
    "opacity",
    "startArrowhead",
    "endArrowhead",
] as const;

/**
 * AnswerBar の Line 正規化で更新できるプロパティ。
 */
type NormalizationChanges = {
    -readonly [property in "x" | (typeof ANSWER_BAR_FIXED_PROPERTIES)[number]]?: ExcalidrawLinearElement[property];
};

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
