import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const mockRoomController = { getRoom: jest.fn() };
const mockAnswerBarAssignmentState = { getAll: jest.fn(), reset: jest.fn() };
const mockUserService = { getUser: jest.fn() };
const mockScoreState = { prepareQuestion: jest.fn(), addQuestionScores: jest.fn(), reset: jest.fn(), get: jest.fn() };

jest.unstable_mockModule("../../../../src/server/features/room/RoomController", () => ({
    roomController: mockRoomController,
}));
jest.unstable_mockModule("../../../../src/server/features/answerBar/AnswerBarAssignmentState", () => ({
    answerBarAssignmentState: mockAnswerBarAssignmentState,
}));
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: mockUserService }));
jest.unstable_mockModule("../../../../src/server/features/score/ScoreState", () => ({ scoreState: mockScoreState }));

const { questionController } = await import("../../../../src/server/features/question/QuestionController");
const { SocketEvents } = await import("../../../../src/shared/SocketEvents");

describe("QuestionController", () => {
    beforeEach(() => {
        Object.values(mockRoomController).forEach((mock) => mock.mockReset());
        Object.values(mockAnswerBarAssignmentState).forEach((mock) => mock.mockReset());
        Object.values(mockUserService).forEach((mock) => mock.mockReset());
        Object.values(mockScoreState).forEach((mock) => mock.mockReset());
    });

    test("作成者が存在する問題を適用すると AnswerBar を再割当し、ルーム全体へ通知する", () => {
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(true),
            hasUser: jest.fn().mockReturnValue(true),
            getUserIds: jest.fn().mockReturnValue([1]),
            setCurrentQuestionId: jest.fn(),
        };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);
        mockUserService.getUser.mockReturnValue({ getName: () => "Alice" });
        mockAnswerBarAssignmentState.reset.mockReturnValue([]);

        expect(
            questionController.apply(socket, 1, { roomId: "room-1", questionId: 1, deleteExternalElements: true }),
        ).toEqual({
            ok: true,
        });

        expect(room.setCurrentQuestionId).toHaveBeenCalledWith(1);
        expect(mockScoreState.prepareQuestion).toHaveBeenCalledWith("room-1", expect.objectContaining({ id: 1 }), []);
        expect(mockAnswerBarAssignmentState.reset).toHaveBeenCalledWith("room-1", [], 3);
        expect(socket.nsp.to).toHaveBeenCalledWith("room-1");
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(
            SocketEvents.QUESTION_APPLIED,
            expect.objectContaining({ deleteExternalElements: true, scrollToContent: false }),
        );
    });

    test("存在しない問題または作成者以外の要求は状態を変更せず、拒否理由を返す", () => {
        const room = { isCreatedBy: jest.fn().mockReturnValue(false), hasUser: jest.fn().mockReturnValue(true) };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);

        expect(
            questionController.apply(socket, 2, { roomId: "room-1", questionId: 1, deleteExternalElements: false }),
        ).toEqual({
            ok: false,
            reason: "not-creator",
        });
        room.isCreatedBy.mockReturnValue(true);
        expect(
            questionController.apply(socket, 1, { roomId: "room-1", questionId: 999, deleteExternalElements: false }),
        ).toEqual({
            ok: false,
            reason: "question-not-found",
        });

        expect(mockAnswerBarAssignmentState.reset).not.toHaveBeenCalled();
        expect(socket.nsp.to).not.toHaveBeenCalled();
    });

    test("scrollToContent の不正な型は状態を変更せず、拒否理由を返す", () => {
        const room = { isCreatedBy: jest.fn().mockReturnValue(true), hasUser: jest.fn().mockReturnValue(true) };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);

        expect(
            questionController.apply(socket, 1, {
                roomId: "room-1",
                questionId: 1,
                deleteExternalElements: false,
                scrollToContent: "false" as never,
            }),
        ).toEqual({ ok: false, reason: "invalid-request" });

        expect(mockAnswerBarAssignmentState.reset).not.toHaveBeenCalled();
        expect(socket.nsp.to).not.toHaveBeenCalled();
    });

    test("問題適用済みのルームでは全問題の管理要素を同期対象から除外する", () => {
        mockRoomController.getRoom.mockReturnValue({ getCurrentQuestionId: () => 2 });

        expect(
            questionController.excludeManagedElements("room-1", [
                { id: "question-1" },
                { id: "choice-left-1" },
                { id: "question-2" },
                { id: "rectangle-question-2-slider-1" },
                { id: "correct-answer-flag-question-2-slider-1" },
                { id: "external" },
            ]),
        ).toEqual([{ id: "external" }]);
    });

    test("作成者は問題指定なしで、現在問題の管理外要素だけを削除できる", () => {
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(true),
            getCurrentQuestionId: jest.fn().mockReturnValue(1),
            isAnswerRevealed: jest.fn().mockReturnValue(false),
        };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);
        mockAnswerBarAssignmentState.getAll.mockReturnValue([]);

        expect(
            questionController.controlCurrent(socket, 1, {
                roomId: "room-1",
                deleteExternalElements: true,
                scrollToContent: false,
            }),
        ).toEqual({ ok: true });
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.QUESTION_REMOVE_EXTERNAL_ELEMENTS);
    });

    test("現在問題への制御は作成者以外、または問題未適用時には通知しない", () => {
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(false),
            getCurrentQuestionId: jest.fn().mockReturnValue(1),
        };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);

        expect(
            questionController.controlCurrent(socket, 2, {
                roomId: "room-1",
                deleteExternalElements: false,
                scrollToContent: true,
            }),
        ).toEqual({ ok: false, reason: "not-creator" });
        room.isCreatedBy.mockReturnValue(true);
        room.getCurrentQuestionId.mockReturnValue(undefined);
        expect(
            questionController.controlCurrent(socket, 1, {
                roomId: "room-1",
                deleteExternalElements: false,
                scrollToContent: true,
            }),
        ).toEqual({ ok: false, reason: "question-not-found" });
        expect(socket.nsp.to).not.toHaveBeenCalled();
    });

    test("scrollToContent=true は現在問題を変更せず、全参加者へスクロールを通知する", () => {
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(true),
            getCurrentQuestionId: jest.fn().mockReturnValue(1),
        };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);

        expect(
            questionController.controlCurrent(socket, 1, {
                roomId: "room-1",
                deleteExternalElements: false,
                scrollToContent: true,
            }),
        ).toEqual({ ok: true });
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.QUESTION_SCROLL_TO_CONTENT);
    });

    test("管理外要素削除後も、解答表示済みの問題は正解マーカーを再表示する", () => {
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(true),
            getCurrentQuestionId: jest.fn().mockReturnValue(1),
            isAnswerRevealed: jest.fn().mockReturnValue(true),
        };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);
        mockAnswerBarAssignmentState.getAll.mockReturnValue([]);

        questionController.controlCurrent(socket, 1, {
            roomId: "room-1",
            deleteExternalElements: true,
            scrollToContent: false,
        });

        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.QUESTION_REMOVE_EXTERNAL_ELEMENTS);
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.QUESTION_REVEALED, { questionId: 1 });
    });

    test("解答表示は一度だけ採点し、正解表示と累積得点をルームへ通知する", () => {
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(true),
            hasUser: jest.fn().mockReturnValue(true),
            getCurrentQuestionId: jest.fn().mockReturnValue(1),
            isAnswerRevealed: jest.fn().mockReturnValue(false),
            revealAnswer: jest.fn(),
        };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);
        mockAnswerBarAssignmentState.getAll.mockReturnValue([]);
        mockScoreState.addQuestionScores.mockReturnValue([{ userId: 1, userName: "Alice", score: 100 }]);

        questionController.reveal(socket, 1, "room-1");

        expect(room.revealAnswer).toHaveBeenCalledTimes(1);
        expect(mockScoreState.addQuestionScores).toHaveBeenCalledTimes(1);
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.QUESTION_REVEALED, { questionId: 1 });
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.SCORES_UPDATED, {
            scores: [{ userId: 1, userName: "Alice", score: 100 }],
            reason: "scored",
        });

        room.isAnswerRevealed.mockReturnValue(true);
        questionController.reveal(socket, 1, "room-1");
        expect(mockScoreState.addQuestionScores).toHaveBeenCalledTimes(1);
    });

    test("score reset は作成者だけに許可し、成功時は 0 点の一覧を通知する", () => {
        const room = { isCreatedBy: jest.fn().mockReturnValue(false) };
        const socket = createSocket();
        mockRoomController.getRoom.mockReturnValue(room);

        expect(questionController.resetScores(socket, 2, "room-1")).toEqual({ ok: false, reason: "not-creator" });
        expect(mockScoreState.reset).not.toHaveBeenCalled();

        room.isCreatedBy.mockReturnValue(true);
        mockScoreState.reset.mockReturnValue([{ userId: 1, userName: "Alice", score: 0 }]);
        expect(questionController.resetScores(socket, 1, "room-1")).toEqual({ ok: true });
        expect(mockScoreState.reset).toHaveBeenCalledWith("room-1");
        expect(socket.nsp.to("room-1").emit).toHaveBeenCalledWith(SocketEvents.SCORES_UPDATED, {
            scores: [{ userId: 1, userName: "Alice", score: 0 }],
            reason: "reset",
        });
    });
});

function createSocket(): Socket & { nsp: { to: jest.Mock } } {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    return { nsp: { to } } as unknown as Socket & { nsp: { to: jest.Mock } };
}
