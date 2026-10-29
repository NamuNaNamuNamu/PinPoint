/**
 * client が Slider を構築するための、描画ライブラリに依存しない定義。
 */
export interface SliderDefinition {
    /**
     * 回答欄の識別子。
     */
    id: string;
    /**
     * 回答欄の左上の X 座標。
     */
    x: number;
    /**
     * 回答欄の左上の Y 座標。
     */
    y: number;
    /**
     * 回答欄の幅。
     */
    width: number;
    /**
     * 回答欄の高さ。
     */
    height: number;
}

/**
 * 初期表示する回答欄の定義。
 *
 * 配列順は AnswerBarAdded の lineIds / labelIds に対応する。
 */
export const sliderDefinitions: readonly SliderDefinition[] = [
    { id: "slider-bar1", x: 100, y: 100, width: 300, height: 100 },
];
