import { jest } from "@jest/globals";

const joinRoom = jest.fn();
const getAll = jest.fn();
const getOrCreate = jest.fn();
const remove = jest.fn();
const getUser = jest.fn();

jest.unstable_mockModule("../../../../src/server/features/room/RoomController", () => ({
    roomController: { joinRoom, leaveRoom: jest.fn(), getRoomIdByUserId: jest.fn(), leaveUser: jest.fn() },
}));
jest.unstable_mockModule("../../../../src/server/features/answerBar/AnswerBarAssignmentState", () => ({
    answerBarAssignmentState: { getAll, getOrCreate, remove, markDisconnected: jest.fn(), removeIfStillDisconnected: jest.fn() },
}));
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: { getUser } }));
jest.unstable_mockModule("../../../../src/shared/Slider/sliderDefinitions", () => ({ sliderDefinitions: [{}, {}] }));
jest.unstable_mockModule("../../../../src/server/features/excalidrawCursor/ExcalidrawCursorSyncController", () => ({
    excalidrawCursorSyncController: { remove: jest.fn() },
}));

const { AnswerBarController } = await import("../../../../src/server/features/answerBar/AnswerBarController");

describe("AnswerBarController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        joinRoom.mockReturnValue("room-1");
        getUser.mockReturnValue({ getName: () => "ゆう" });
    });

    test("入室時に所有者名とラベル ID を持つ新規割当をルームへ通知すること", () => {
        const emit = jest.fn();
        const roomEmit = jest.fn();
        const socket = { emit, nsp: { to: jest.fn(() => ({ emit: roomEmit })) } } as any;
        getAll.mockReturnValue([]);
        getOrCreate.mockReturnValue({
            assignment: { answerBarId: "new", ownerUserId: 1, ownerUserName: "ゆう", lineIds: ["line-1", "line-2"], labelIds: ["label-1", "label-2"], slot: 0 },
            isNew: true,
        });

        expect(new AnswerBarController().joinRoom(socket, 1, "room-1")).toBe("room-1");
        expect(getOrCreate).toHaveBeenCalledWith("room-1", 1, "ゆう", 2);
        expect(roomEmit).toHaveBeenCalledWith("answer-bar-added", expect.objectContaining({ ownerUserName: "ゆう", labelIds: ["label-1", "label-2"] }));
    });
});
