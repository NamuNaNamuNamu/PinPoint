import { jest } from "@jest/globals";

import type { AnswerBarAdded, AnswerBarOwnerNameUpdated, AnswerBarRemoved } from "../../../../src/shared/answerBar/AnswerBarEvents";

const off = jest.fn();
const on = jest.fn();
const add = jest.fn();
const remove = jest.fn();
const updateOwnerName = jest.fn();
const setOperatorUserId = jest.fn();

jest.unstable_mockModule("../../../../src/client/socket/socket", () => ({ socket: { off, on } }));
jest.unstable_mockModule("../../../../src/client/features/answerBar/AnswerBarSceneController", () => ({
    answerBarSceneController: { add, remove, updateOwnerName, setOperatorUserId },
}));

const { registerAnswerBarListener } = await import("../../../../src/client/features/answerBar/registerAnswerBarListener");

describe("registerAnswerBarListener", () => {
    beforeEach(() => { jest.clearAllMocks(); });

    test("既存 listener を解除して名前ラベルを含む追加・削除 listener を登録すること", () => {
        registerAnswerBarListener(10);
        const onAdded = on.mock.calls[0][1] as (event: AnswerBarAdded) => void;
        const onRemoved = on.mock.calls[1][1] as (event: AnswerBarRemoved) => void;
        const onOwnerNameUpdated = on.mock.calls[2][1] as (event: AnswerBarOwnerNameUpdated) => void;
        onAdded({ answerBarId: "bar", ownerUserId: 1, ownerUserName: "ゆう", lineIds: ["line"], labelIds: ["label"], slot: 0 });
        onRemoved({ answerBarId: "bar", lineIds: ["line"], labelIds: ["label"] });
        onOwnerNameUpdated({ answerBarId: "bar", ownerUserName: "ゆうこ", labelIds: ["label"] });

        expect(add).toHaveBeenCalledWith(expect.objectContaining({ ownerUserName: "ゆう", labelIds: ["label"] }), 10);
        expect(remove).toHaveBeenCalledWith({ answerBarId: "bar", lineIds: ["line"], labelIds: ["label"] });
        expect(updateOwnerName).toHaveBeenCalledWith({ answerBarId: "bar", ownerUserName: "ゆうこ", labelIds: ["label"] });
        expect(setOperatorUserId).toHaveBeenCalledWith(10);
    });
});
