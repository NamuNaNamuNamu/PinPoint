import { jest } from "@jest/globals";

const joinRoom = jest.fn();
const getAll = jest.fn();
const getOrCreate = jest.fn();
const remove = jest.fn();

jest.unstable_mockModule("../../../../src/server/features/room/RoomController", () => ({
    roomController: { joinRoom, leaveRoom: jest.fn(), getRoomIdByUserId: jest.fn() },
}));
jest.unstable_mockModule("../../../../src/server/features/answerBar/AnswerBarAssignmentState", () => ({
    answerBarAssignmentState: { getAll, getOrCreate, remove, markDisconnected: jest.fn(), removeIfStillDisconnected: jest.fn() },
}));
jest.unstable_mockModule("../../../../src/shared/Slider/Sliders", () => ({ sliders: [{}, {}] }));
jest.unstable_mockModule("../../../../src/server/features/excalidrawCursor/ExcalidrawCursorSyncController", () => ({
    excalidrawCursorSyncController: { remove: jest.fn() },
}));

const { AnswerBarController } = await import("../../../../src/server/features/answerBar/AnswerBarController");

describe("AnswerBarController", () => {
    test("入室時に既存割当を本人へ送り、新規割当をルームへ通知すること", () => {
        const emit = jest.fn();
        const roomEmit = jest.fn();
        const socket = { emit, nsp: { to: jest.fn(() => ({ emit: roomEmit })) } } as any;
        joinRoom.mockReturnValue("room-1");
        getAll.mockReturnValue([{ answerBarId: "existing", ownerUserId: 2, lineIds: ["a", "b"], slot: 0 }]);
        getOrCreate.mockReturnValue({ assignment: { answerBarId: "new", ownerUserId: 1, lineIds: ["c", "d"], slot: 1 }, isNew: true });

        expect(new AnswerBarController().joinRoom(socket, 1, "room-1")).toBe("room-1");
        expect(emit).toHaveBeenCalledWith("answer-bar-added", expect.objectContaining({ answerBarId: "existing" }));
        expect(roomEmit).toHaveBeenCalledWith("answer-bar-added", expect.objectContaining({ answerBarId: "new" }));
    });
});
