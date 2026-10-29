import type { QuestionSliderDefinition } from "../../../../shared/question/QuestionTemplate";
import { Slider } from "./Slider";

/**
 * この client の Excalidraw scene を操作する Slider インスタンス。
 */
export let sliders: Slider[] = [];

/**
 * 問題テンプレートの Slider 定義で、現在の Slider 群を置き換える。
 *
 * @param definitions 新たに表示する Slider 定義。
 */
export function setSliders(definitions: readonly QuestionSliderDefinition[]): void {
    sliders = definitions.map((definition) => new Slider(definition));
}
