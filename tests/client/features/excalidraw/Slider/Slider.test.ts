import { jest } from "@jest/globals";

const newElementWith = jest.fn();
const convertToExcalidrawElements = jest.fn();

jest.unstable_mockModule("@excalidraw/excalidraw", () => ({ convertToExcalidrawElements, newElementWith }));

const { Slider } = await import("../../../../../src/client/features/excalidraw/Slider/Slider");

/** Slider の slot 座標算出に関する単体テスト。 */
describe("Slider", () => {
    test("slot 0 から 10 を二分割の細分化順で初期 X 座標へ変換すること", () => {
        const slider = new Slider({ id: "slider", name: "Slider", x: 0, y: 0, width: 1600, height: 1600 });
        const getInitialX = (slider as any).getInitialX.bind(slider) as (slot: number) => number;

        expect(Array.from({ length: 11 }, (_, slot) => getInitialX(slot))).toEqual([
            800, 400, 1200, 200, 600, 1000, 1400, 100, 300, 500, 700,
        ]);
    });

    test("slot 0 から 10 を同じ比率で名前ラベルの固定 Y 座標へ変換すること", () => {
        const slider = new Slider({ id: "slider", name: "Slider", x: 0, y: 0, width: 1600, height: 1600 });
        const getInitialLabelY = (slider as any).getInitialLabelY.bind(slider) as (slot: number) => number;

        expect(Array.from({ length: 11 }, (_, slot) => getInitialLabelY(slot))).toEqual([
            800, 400, 1200, 200, 600, 1000, 1400, 100, 300, 500, 700,
        ]);
    });

    test("AnswerBar の名前ラベルに対応するバーと同じ slot 色を設定すること", () => {
        const slider = new Slider({ id: "slider", name: "Slider", x: 0, y: 0, width: 1600, height: 1600 });
        const answerBar = slider.addAnswerBar({
            answerBarId: "answer-bar-1",
            ownerUserId: 1,
            ownerUserName: "Alice",
            operatorUserId: 1,
            lineId: "line-1",
            labelId: "label-1",
            lineIds: ["line-1"],
            labelIds: ["label-1"],
            slot: 1,
        });

        const [line, label] = answerBar!.getSkeletons();

        expect(label.strokeColor).toBe(line.strokeColor);
        expect(label.strokeColor).toBe("#43A047");
    });
});
