import { jest } from "@jest/globals";

import type { AnswerBarAdded, AnswerBarRemoved } from "../../../../src/shared/answerBar/AnswerBarEvents";

const off = jest.fn();
const on = jest.fn();
const add = jest.fn();
const remove = jest.fn();
const setOperatorUserId = jest.fn();

jest.unstable_mockModule("../../../../src/client/socket/socket", () => ({ socket: { off, on } }));
jest.unstable_mockModule("../../../../src/client/features/answerBar/AnswerBarSceneController", () => ({
    answerBarSceneController: { add, remove, setOperatorUserId },
}));

const { registerAnswerBarListener } =
    await import("../../../../src/client/features/answerBar/registerAnswerBarListener");

describe("registerAnswerBarListener", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("既存 listener を解除して追加・削除 listener を登録すること", () => {
        registerAnswerBarListener(10);

        expect(off).toHaveBeenCalledTimes(2);
        expect(on).toHaveBeenCalledTimes(2);

        const onAdded = on.mock.calls[0][1] as (event: AnswerBarAdded) => void;
        const onRemoved = on.mock.calls[1][1] as (event: AnswerBarRemoved) => void;
        onAdded({ answerBarId: "bar", ownerUserId: 1, lineIds: ["line"], slot: 0 });
        onRemoved({ answerBarId: "bar", lineIds: ["line"] });

        expect(add).toHaveBeenCalledWith(expect.objectContaining({ answerBarId: "bar" }), 10);
        expect(remove).toHaveBeenCalledWith({ answerBarId: "bar", lineIds: ["line"] });
        expect(setOperatorUserId).toHaveBeenCalledWith(10);
    });
});
