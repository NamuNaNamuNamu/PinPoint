import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { jest } from "@jest/globals";

const updateScene = jest.fn();
const getSceneElements = jest.fn();
const getSceneElementsIncludingDeleted = jest.fn();
const addAnswerBar = jest.fn();
const removeAnswerBar = jest.fn();
const forEachAnswerBar = jest.fn<(callback: (answerBar: AnswerBarForSceneController) => void) => void>();
const centerLabelInElements = jest.fn((elements: OrderedExcalidrawElement[]) =>
    elements.map((element) => ({ ...element, centered: true })),
);

type AnswerBarForSceneController = {
    getAnswerBarId(): string;
    getLineId(): string;
    getLabelId(): string;
    setOwnerUserName(ownerUserName: string): void;
};

jest.unstable_mockModule("../../../../src/client/features/excalidraw/Slider/Sliders", () => ({
    sliders: [
        { addAnswerBar, removeAnswerBar, forEachAnswerBar },
        { addAnswerBar, removeAnswerBar, forEachAnswerBar },
    ],
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: {
        getApi: () => ({ updateScene }),
        getActiveSceneElements: getSceneElements,
        getSceneElementsWithTombstones: getSceneElementsIncludingDeleted,
    },
}));
jest.unstable_mockModule("@excalidraw/excalidraw", () => ({
    convertToExcalidrawElements: jest.fn((elements) => elements),
}));

const { answerBarSceneController } = await import("../../../../src/client/features/answerBar/AnswerBarSceneController");

/** AnswerBarSceneController の単体テスト。 */
describe("AnswerBarSceneController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSceneElementsIncludingDeleted.mockReturnValue([{ id: "existing" }]);
        addAnswerBar.mockReturnValue({
            getSkeletons: () => [{ id: "new-line" }, { id: "new-label" }],
            centerLabelInElements,
        });
    });

    test("追加通知を全 Slider に適用し、line と名前ラベルを scene へ追加すること", () => {
        answerBarSceneController.add(
            {
                answerBarId: "answer-bar-1",
                ownerUserId: 1,
                ownerUserName: "ほげ",
                lineIds: ["line-1", "line-2"],
                labelIds: ["label-1", "label-2"],
                slot: 0,
            },
            1,
        );

        expect(addAnswerBar).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ lineId: "line-1", labelId: "label-1", operatorUserId: 1 }),
        );
        expect(centerLabelInElements).toHaveBeenCalledTimes(2);
        expect(updateScene).toHaveBeenCalledWith({
            elements: [
                { id: "existing" },
                { id: "new-line", centered: true },
                { id: "new-label", centered: true },
                { id: "new-line", centered: true },
                { id: "new-label", centered: true },
            ],
        });
    });

    test("削除通知では対象 AnswerBar の line と名前ラベルを除去すること", () => {
        getSceneElementsIncludingDeleted.mockReturnValue([{ id: "keep" }, { id: "line-1" }, { id: "label-1" }]);
        answerBarSceneController.remove({ answerBarId: "answer-bar-1", lineIds: ["line-1"], labelIds: ["label-1"] });

        expect(removeAnswerBar).toHaveBeenCalledWith("answer-bar-1");
        expect(updateScene).toHaveBeenCalledWith({ elements: [{ id: "keep" }] });
    });

    test("所有者名更新通知では対象 AnswerBar の名前ラベルを更新すること", () => {
        const setOwnerUserName = jest.fn();
        forEachAnswerBar.mockImplementation((callback) => {
            callback({
                getAnswerBarId: () => "answer-bar-1",
                getLineId: () => "line-1",
                getLabelId: () => "label-1",
                setOwnerUserName,
            });
        });
        getSceneElements.mockReturnValue([{ id: "line-1" }, { id: "label-1" }]);

        answerBarSceneController.updateOwnerName({
            answerBarId: "answer-bar-1",
            ownerUserName: "ゆうこ",
            labelIds: ["label-1"],
        });

        expect(setOwnerUserName).toHaveBeenCalledWith("ゆうこ");
    });

    test("管理中 AnswerBar 要素が scene から消えた場合、直近の正常状態で復元すること", () => {
        forEachAnswerBar.mockImplementation((callback) => {
            callback({
                getAnswerBarId: () => "answer-bar-1",
                getLineId: () => "line-1",
                getLabelId: () => "label-1",
                setOwnerUserName: jest.fn(),
            });
        });
        getSceneElements
            .mockReturnValueOnce([
                { id: "line-1", x: 200 },
                { id: "label-1", x: 200 },
            ])
            .mockReturnValue([{ id: "label-1", x: 200 }]);
        answerBarSceneController.rememberCurrentElements();

        getSceneElementsIncludingDeleted.mockReturnValue([
            { id: "line-1", x: 200, isDeleted: true },
            { id: "label-1", x: 200 },
        ]);

        expect(answerBarSceneController.restoreMissingElements()).toBe(true);
        expect(updateScene).toHaveBeenLastCalledWith({
            elements: [
                { id: "line-1", x: 200, isDeleted: true },
                { id: "label-1", x: 200 },
                { id: "line-1", x: 200 },
            ],
        });
    });
});
