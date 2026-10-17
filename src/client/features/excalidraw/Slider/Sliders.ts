import { sliderDefinitions } from "../../../../shared/Slider/sliderDefinitions";
import { Slider } from "./Slider";

/**
 * この client の Excalidraw scene を操作する Slider インスタンス。
 */
export const sliders: Slider[] = sliderDefinitions.map((definition) => new Slider(definition));
