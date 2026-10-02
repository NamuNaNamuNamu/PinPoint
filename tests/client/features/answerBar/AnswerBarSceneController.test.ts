import { jest } from "@jest/globals";

const updateScene = jest.fn();
const getSceneElements = jest.fn();
const addAnswerBar = jest.fn();
const removeAnswerBar = jest.fn();
const forEachAnswerBar = jest.fn();

jest.unstable_mockModule("../../../../src/shared/Slider/Sliders", () => ({
    sliders: [
        { addAnswerBar, removeAnswerBar, forEachAnswerBar },
        { addAnswerBar, removeAnswerBar, forEachAnswerBar },
    ],
}));
jest.unstable_mockModule(
    "../../../../src/client/features/excalidraw/ExcalidrawAPIHolder",
    () => ({
        excalidrawAPIHolder: {
            getApi: () => ({ getSceneElements, updateScene }),
        },
    }),
);
jest.unstable_mockModule("@excalidraw/excalidraw", () => ({
    convertToExcalidrawElements: jest.fn((elements) => elements),
}));

const { answerBarSceneController } = await import(
    "../../../../src/client/features/answerBar/AnswerBarSceneController"
);

/**
 * AnswerBarSceneController の単体テスト。
 */
describe("AnswerBarSceneController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSceneElements.mockReturnValue([{ id: "existing" }]);
        addAnswerBar.mockReturnValue({
            getSkeleton: () => ({ id: "new-line" }),
        });
    });

    test("追加通知を全 Slider に適用し、既存 scene を保持して追加すること", () => {
        answerBarSceneController.add({
            answerBarId: "answer-bar-1",
            ownerUserId: 1,
            lineIds: ["line-1", "line-2"],
            slot: 0,
        }, 1);

        expect(addAnswerBar).toHaveBeenCalledTimes(2);
        expect(addAnswerBar).toHaveBeenNthCalledWith(1, expect.objectContaining({
            lineId: "line-1",
            operatorUserId: 1,
        }));
        expect(updateScene).toHaveBeenCalledWith({
            elements: [{ id: "existing" }, { id: "new-line" }, { id: "new-line" }],
        });
    });

    test("削除通知では対象 AnswerBar と対応する line ID だけを除去すること", () => {
        getSceneElements.mockReturnValue([
            { id: "keep" },
            { id: "line-1" },
            { id: "line-2" },
        ]);

        answerBarSceneController.remove({
            answerBarId: "answer-bar-1",
            lineIds: ["line-1", "line-2"],
        });

        expect(removeAnswerBar).toHaveBeenCalledTimes(2);
        expect(removeAnswerBar).toHaveBeenCalledWith("answer-bar-1");
        expect(updateScene).toHaveBeenCalledWith({
            elements: [{ id: "keep" }],
        });
    });

    test("退出時は保持中の全 AnswerBar と対応する line ID を除去すること", () => {
        getSceneElements.mockReturnValue([
            { id: "keep" },
            { id: "line-1" },
            { id: "line-2" },
        ]);
        forEachAnswerBar
            .mockImplementationOnce((callback: any) => {
                callback({
                    getAnswerBarId: () => "answer-bar-1",
                    getLineId: () => "line-1",
                });
            })
            .mockImplementationOnce((callback: any) => {
                callback({
                    getAnswerBarId: () => "answer-bar-1",
                    getLineId: () => "line-2",
                });
            });

        answerBarSceneController.clear();

        expect(removeAnswerBar).toHaveBeenCalledTimes(2);
        expect(removeAnswerBar).toHaveBeenCalledWith("answer-bar-1");
        expect(updateScene).toHaveBeenCalledWith({
            elements: [{ id: "keep" }],
        });
    });
});
