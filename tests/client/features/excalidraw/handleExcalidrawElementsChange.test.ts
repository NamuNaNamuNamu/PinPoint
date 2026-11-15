import { jest } from "@jest/globals";

import type { AnswerBarPositionUpdateRequest } from "../../../../src/shared/answerBar/AnswerBarEvents";

const restoreMissingElements = jest.fn();
const rememberCurrentElements = jest.fn();
const getSceneElementsWithTombstones = jest.fn();
const updateScene = jest.fn();
const syncAnswerBarPosition = jest.fn();
const syncElements = jest.fn();
const isRemoteApplying = jest.fn();
const forEachAnswerBar = jest.fn<(callback: (answerBar: AnswerBarForElementsChange) => void) => void>();

type AnswerBarForElementsChange = {
    getElementUpdates(operatorUserId: number): {
        elements: readonly { id: string; x: number }[];
        position?: AnswerBarPositionUpdateRequest;
    };
};

jest.unstable_mockModule("../../../../src/client/features/answerBar/AnswerBarSceneController", () => ({
    answerBarSceneController: { restoreMissingElements, rememberCurrentElements },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/Slider/Sliders", () => ({
    sliders: [{ forEachAnswerBar }],
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/Elements/Line/lines", () => ({ lines: [] }));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: {
        getApi: () => ({ updateScene }),
        getSceneElementsWithTombstones,
    },
}));
jest.unstable_mockModule("../../../../src/client/socket/SocketController", () => ({
    socketController: { syncAnswerBarPosition, syncElements },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/excalidrawSync/ExcalidrawSyncController", () => ({
    excalidrawSyncController: { isRemoteApplying },
}));

const { handleExcalidrawElementsChange } = await import(
    "../../../../src/client/features/excalidraw/handleExcalidrawElementsChange"
);

describe("handleExcalidrawElementsChange", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        isRemoteApplying.mockReturnValue(false);
        restoreMissingElements.mockReturnValue(false);
        getSceneElementsWithTombstones.mockReturnValue([{ id: "line-1", x: 500 }, { id: "label-1", x: 480 }]);
    });

    test("範囲内の水平移動でも位置更新を送り、ローカルの復元用 snapshot を更新すること", () => {
        forEachAnswerBar.mockImplementation((callback) => {
            callback({
                getElementUpdates: () => ({
                    elements: [{ id: "label-1", x: 490 }],
                    position: { answerBarId: "bar-1", lineId: "line-1", x: 500 },
                }),
            });
        });

        handleExcalidrawElementsChange([], 1);

        expect(syncAnswerBarPosition).toHaveBeenCalledWith({ answerBarId: "bar-1", lineId: "line-1", x: 500 });
        expect(updateScene).toHaveBeenCalledWith({
            elements: [{ id: "line-1", x: 500 }, { id: "label-1", x: 490 }],
        });
        expect(rememberCurrentElements).toHaveBeenCalledTimes(1);
        expect(syncElements).not.toHaveBeenCalled();
    });

    test("位置更新がない変更では AnswerBar 位置イベントを送らないこと", () => {
        forEachAnswerBar.mockImplementation((callback) => {
            callback({ getElementUpdates: () => ({ elements: [] }) });
        });

        handleExcalidrawElementsChange([], 1);

        expect(syncAnswerBarPosition).not.toHaveBeenCalled();
    });
});
