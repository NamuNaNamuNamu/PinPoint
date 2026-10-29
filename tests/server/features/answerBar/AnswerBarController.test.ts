import { jest } from "@jest/globals";

import { Room } from "../../../../src/server/features/room/Room";
import { User } from "../../../../src/server/features/user/User";

type RoomController = typeof import("../../../../src/server/features/room/RoomController").roomController;
type AnswerBarAssignmentState =
    typeof import("../../../../src/server/features/answerBar/AnswerBarAssignmentState").answerBarAssignmentState;
type ScoreState = typeof import("../../../../src/server/features/score/ScoreState").scoreState;
type UserService = typeof import("../../../../src/server/features/user/UserService").userService;

const joinRoom = jest.fn<RoomController["joinRoom"]>();
const leaveRoom = jest.fn<RoomController["leaveRoom"]>();
const getAll = jest.fn<AnswerBarAssignmentState["getAll"]>();
const getOrCreate = jest.fn<AnswerBarAssignmentState["getOrCreate"]>();
const remove = jest.fn<AnswerBarAssignmentState["remove"]>();
const updateOwnerUserName = jest.fn<AnswerBarAssignmentState["updateOwnerUserName"]>();
const getUser = jest.fn<UserService["getUser"]>();
const getRoomIdByUserId = jest.fn<RoomController["getRoomIdByUserId"]>();
const getRoom = jest.fn<RoomController["getRoom"]>();
const markDisconnected = jest.fn<AnswerBarAssignmentState["markDisconnected"]>();
const removeIfStillDisconnected = jest.fn<AnswerBarAssignmentState["removeIfStillDisconnected"]>();
const updateParticipantName = jest.fn<ScoreState["updateParticipantName"]>();
const getScores = jest.fn<ScoreState["get"]>();

jest.unstable_mockModule("../../../../src/server/features/room/RoomController", () => ({
    roomController: { joinRoom, leaveRoom, getRoomIdByUserId, getRoom, leaveUser: jest.fn() },
}));
jest.unstable_mockModule("../../../../src/server/features/answerBar/AnswerBarAssignmentState", () => ({
    answerBarAssignmentState: {
        getAll,
        getOrCreate,
        remove,
        updateOwnerUserName,
        markDisconnected,
        removeIfStillDisconnected,
    },
}));
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: { getUser } }));
jest.unstable_mockModule("../../../../src/server/features/score/ScoreState", () => ({
    scoreState: { updateParticipantName, get: getScores },
}));
jest.unstable_mockModule("../../../../src/server/features/excalidrawCursor/ExcalidrawCursorSyncController", () => ({
    excalidrawCursorSyncController: { remove: jest.fn() },
}));

const { AnswerBarController } = await import("../../../../src/server/features/answerBar/AnswerBarController");

describe("AnswerBarController", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        joinRoom.mockReturnValue("room-1");
        getUser.mockReturnValue(createUser());
        getRoomIdByUserId.mockReturnValue(undefined);
        getRoom.mockReturnValue(createRoom());
        getAll.mockReturnValue([]);
        getOrCreate.mockReturnValue({
            assignment: {
                answerBarId: "new",
                ownerUserId: 1,
                ownerUserName: "ゆう",
                lineIds: ["line-1", "line-2"],
                labelIds: ["label-1", "label-2"],
                slot: 0,
            },
            isNew: true,
        });
    });

    test("入室時に所有者名とラベル ID を持つ新規割当をルームへ通知すること", () => {
        const emit = jest.fn();
        const roomEmit = jest.fn();
        const socket = { emit, nsp: { to: jest.fn(() => ({ emit: roomEmit })) } } as any;
        getRoom.mockReturnValue(createRoom(2));
        getOrCreate.mockReturnValue({
            assignment: {
                answerBarId: "new",
                ownerUserId: 1,
                ownerUserName: "ゆう",
                lineIds: ["line-1", "line-2"],
                labelIds: ["label-1", "label-2"],
                slot: 0,
            },
            isNew: true,
        });

        expect(new AnswerBarController().joinRoom(socket, 1, "room-1")).toBe("room-1");
        expect(getAll).toHaveBeenCalledWith("room-1");
        expect(getOrCreate).toHaveBeenCalledWith("room-1", 1, "ゆう", 3);
        expect(roomEmit).toHaveBeenCalledWith(
            "answer-bar-added",
            expect.objectContaining({ ownerUserName: "ゆう", labelIds: ["label-1", "label-2"] }),
        );
    });

    test("参加先が存在する場合は旧ルームの AnswerBar と所属を削除してから入室すること", () => {
        const oldRoomEmit = jest.fn();
        const newRoomEmit = jest.fn();
        const socket = {
            emit: jest.fn(),
            nsp: {
                to: jest.fn((roomId: string) => ({ emit: roomId === "room-old" ? oldRoomEmit : newRoomEmit })),
            },
        } as any;
        getRoomIdByUserId.mockReturnValue("room-old");
        remove.mockReturnValue({ answerBarId: "bar-old", lineIds: ["line-old"], labelIds: ["label-old"] });

        expect(new AnswerBarController().joinRoom(socket, 1, "room-1")).toBe("room-1");

        expect(remove).toHaveBeenCalledWith("room-old", 1);
        expect(oldRoomEmit).toHaveBeenCalledWith("answer-bar-removed", {
            answerBarId: "bar-old",
            lineIds: ["line-old"],
            labelIds: ["label-old"],
        });
        expect(leaveRoom).toHaveBeenCalledWith(socket, "room-old");
        expect(joinRoom).toHaveBeenCalledWith(socket, 1, "room-1");
        expect(oldRoomEmit.mock.invocationCallOrder[0]).toBeLessThan(leaveRoom.mock.invocationCallOrder[0]);
        expect(leaveRoom.mock.invocationCallOrder[0]).toBeLessThan(joinRoom.mock.invocationCallOrder[0]);
    });

    test("参加先が存在しない場合は旧ルームから退出しないこと", () => {
        const socket = { nsp: { to: jest.fn() } } as any;
        getRoom.mockReturnValue(undefined);
        getRoomIdByUserId.mockReturnValue("room-old");

        expect(new AnswerBarController().joinRoom(socket, 1, "missing")).toBeNull();

        expect(remove).not.toHaveBeenCalled();
        expect(leaveRoom).not.toHaveBeenCalled();
        expect(joinRoom).not.toHaveBeenCalled();
    });

    test("所有者名更新時に同じルームへ更新通知すること", () => {
        const emit = jest.fn();
        const roomEmit = jest.fn();
        const socket = { emit, nsp: { to: jest.fn(() => ({ emit: roomEmit })) } } as any;
        getRoomIdByUserId.mockReturnValue("room-1");
        updateOwnerUserName.mockReturnValue({
            answerBarId: "bar-1",
            ownerUserName: "ゆうこ",
            labelIds: ["label-1", "label-2"],
        });

        new AnswerBarController().updateOwnerUserName(socket, 1, "ゆうこ");

        expect(updateOwnerUserName).toHaveBeenCalledWith("room-1", 1, "ゆうこ");
        expect(roomEmit).toHaveBeenCalledWith("answer-bar-owner-name-updated", {
            answerBarId: "bar-1",
            ownerUserName: "ゆうこ",
            labelIds: ["label-1", "label-2"],
        });
    });

    test("所有者名更新時に得点一覧の表示名も更新すること", () => {
        const roomEmit = jest.fn();
        const socket = { nsp: { to: jest.fn(() => ({ emit: roomEmit })) } } as any;
        getRoomIdByUserId.mockReturnValue("room-1");
        updateParticipantName.mockReturnValue(true);
        getScores.mockReturnValue([{ userId: 1, userName: "ゆうこ", score: 10 }]);

        new AnswerBarController().updateOwnerUserName(socket, 1, "ゆうこ");

        expect(updateParticipantName).toHaveBeenCalledWith("room-1", 1, "ゆうこ");
        expect(roomEmit).toHaveBeenCalledWith("scores-updated", {
            scores: [{ userId: 1, userName: "ゆうこ", score: 10 }],
            reason: "snapshot",
        });
    });

    test("古い Socket の切断では AnswerBar の削除猶予を開始しないこと", () => {
        const socket = { id: "socket-old", nsp: { to: jest.fn() } } as any;
        getUser.mockReturnValue(createUser("socket-new"));

        new AnswerBarController().handleDisconnecting(socket, 1);

        expect(markDisconnected).not.toHaveBeenCalled();
    });

    test("最新 Socket の切断では猶予期限後に AnswerBar を削除すること", () => {
        jest.useFakeTimers();
        const emit = jest.fn();
        const socket = { id: "socket-1", nsp: { to: jest.fn(() => ({ emit })) } } as any;
        getUser.mockReturnValue(createUser("socket-1"));
        getRoomIdByUserId.mockReturnValue("room-1");
        markDisconnected.mockReturnValue("token-1");
        removeIfStillDisconnected.mockReturnValue({ answerBarId: "bar-1", lineIds: ["line"], labelIds: ["label"] });

        new AnswerBarController().handleDisconnecting(socket, 1);
        jest.advanceTimersByTime(30_000);

        expect(removeIfStillDisconnected).toHaveBeenCalledWith("room-1", 1, "token-1");
        expect(emit).toHaveBeenCalledWith("answer-bar-removed", expect.objectContaining({ answerBarId: "bar-1" }));
        jest.useRealTimers();
    });

    test("ユーザーが未設定または未登録の場合は切断猶予を開始しないこと", () => {
        const socket = { id: "socket-1", nsp: { to: jest.fn() } } as any;
        getUser.mockReturnValue(undefined);

        new AnswerBarController().handleDisconnecting(socket, undefined);

        expect(getRoomIdByUserId).not.toHaveBeenCalled();
        expect(markDisconnected).not.toHaveBeenCalled();
    });
});

function createUser(socketId = "socket-1"): User {
    return new User({ id: 1, name: "ゆう", socketId });
}

function createRoom(creatorUserId = 1): Room {
    const room = new Room({ id: "room-1", creatorUserId });
    room.setCurrentQuestionId(1);
    return room;
}
