/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { InitialRoomCommand } from "../../../../src/client/features/url/Url";
import type { UserParams } from "../../../../src/server/features/user/User";
import type { ApplyQuestionResult, ControlCurrentQuestionRequest } from "../../../../src/shared/question/QuestionEvents";
import type { JoinRoomResponse } from "../../../../src/shared/room/RoomEvents";

type ConnectListener = () => void;
type OnConnect = (listener: ConnectListener) => () => void;
type OnDisconnect = (listener: ConnectListener) => () => void;
type GetUser = (userId: number | undefined) => Promise<UserParams | undefined>;
type UpdateSocketId = (userId: number | undefined) => Promise<UserParams | undefined>;
type RegisterUser = (userName: string) => Promise<UserParams>;
type ControlCurrentQuestion = (request: ControlCurrentQuestionRequest) => Promise<ApplyQuestionResult>;
type ResetScores = (roomId: string) => Promise<ApplyQuestionResult>;
type SetUserScore = (typeof import("../../../../src/client/socket/SocketController").socketController)["setUserScore"];
type GetSocketId = () => string | undefined;
type JoinRoom = (userId: number, roomId: string) => Promise<JoinRoomResponse | null>;
type GetUserIdForCurrentNavigation = () => number | undefined;
type SetUserId = (userId: number) => void;
type GetInitialRoomCommand = () => InitialRoomCommand | undefined;
type ReplaceRoomUrl = (roomId: string) => void;
type WaitForInitialUrlControlReadiness = () => Promise<void>;
type RegisterAnswerBarListener = (operatorUserId: number) => void;
type RegisterQuestionListener = (operatorUserId: number) => void;
type RegisterScoreListener = () => void;

const onConnect = jest.fn<OnConnect>();
const onDisconnect = jest.fn<OnDisconnect>();
const getUser = jest.fn<GetUser>();
const updateSocketId = jest.fn<UpdateSocketId>();
const registerUser = jest.fn<RegisterUser>();
const controlCurrentQuestion = jest.fn<ControlCurrentQuestion>();
const resetScores = jest.fn<ResetScores>();
const setUserScore = jest.fn<SetUserScore>();
const getSocketId = jest.fn<GetSocketId>();
const joinRoom = jest.fn<JoinRoom>();
const getUserIdForCurrentNavigation = jest.fn<GetUserIdForCurrentNavigation>();
const setUserId = jest.fn<SetUserId>();
const getInitialRoomCommand = jest.fn<GetInitialRoomCommand>();
const replaceRoomUrl = jest.fn<ReplaceRoomUrl>();
const waitForInitialUrlControlReadiness = jest.fn<WaitForInitialUrlControlReadiness>();
const registerAnswerBarListener = jest.fn<RegisterAnswerBarListener>();
const registerQuestionListener = jest.fn<RegisterQuestionListener>();
const registerScoreListener = jest.fn<RegisterScoreListener>();

let connectListener: ConnectListener | undefined;

onConnect.mockImplementation((listener) => {
    connectListener = listener;

    return () => {
        if (connectListener === listener) {
            connectListener = undefined;
        }
    };
});
onDisconnect.mockImplementation(() => () => undefined);

jest.unstable_mockModule("../../../../src/client/socket/SocketController", () => ({
    socketController: {
        onConnect,
        onDisconnect,
        getUser,
        updateSocketId,
        registerUser,
        controlCurrentQuestion,
        resetScores,
        setUserScore,
        getSocketId,
    },
}));
jest.unstable_mockModule("../../../../src/client/features/answerBar/AnswerBarSceneController", () => ({
    answerBarSceneController: { getOwnedPositionUpdates: () => [] },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: { getSceneElementsWithTombstones: () => [] },
}));
jest.unstable_mockModule("../../../../src/client/features/room/joinRoom", () => ({ joinRoom }));
jest.unstable_mockModule("../../../../src/client/features/sessionStorage/sessionStorage", () => ({
    userSessionStorage: { getUserIdForCurrentNavigation, setUserId },
}));
jest.unstable_mockModule("../../../../src/client/features/url/Url", () => ({
    url: { getInitialRoomCommand, replaceRoomUrl },
}));
jest.unstable_mockModule("../../../../src/client/features/url/waitForInitialUrlControlReadiness", () => ({
    waitForInitialUrlControlReadiness,
}));
jest.unstable_mockModule("../../../../src/client/features/answerBar/registerAnswerBarListener", () => ({
    registerAnswerBarListener,
}));
jest.unstable_mockModule("../../../../src/client/features/question/registerQuestionListener", () => ({
    registerQuestionListener,
}));
jest.unstable_mockModule("../../../../src/client/features/score/registerScoreListener", () => ({
    registerScoreListener,
}));

const { useRoomConnection } = await import("../../../../src/client/features/room/useRoomConnection");

function RoomConnectionHarness() {
    useRoomConnection({ enabled: true });
    return null;
}

describe("useRoomConnection", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        jest.clearAllMocks();
        connectListener = undefined;
        getUserIdForCurrentNavigation.mockReturnValue(1);
        getUser.mockResolvedValue({ id: 1, name: "名無し", socketId: "socket-1" });
        updateSocketId.mockResolvedValue({ id: 1, name: "名無し", socketId: "socket-1" });
        registerUser.mockResolvedValue({ id: 1, name: "名無し", socketId: "socket-1" });
        controlCurrentQuestion.mockResolvedValue({ ok: true });
        resetScores.mockResolvedValue({ ok: true });
        setUserScore.mockResolvedValue({ ok: true });
        getSocketId.mockReturnValue("socket-1");
        joinRoom.mockResolvedValue({ roomId: "room-1", isCreator: true });
        waitForInitialUrlControlReadiness.mockResolvedValue(undefined);
        getInitialRoomCommand.mockReturnValue({
            roomId: "room-1",
            deleteExternalElements: true,
            scoreReset: false,
        });
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => {
            root.unmount();
        });
        container.remove();
    });

    test("初期 URL の管理者操作を一度だけ実行し、再接続では再送しないこと", async () => {
        await renderAndFlush(root);

        expect(getInitialRoomCommand).toHaveBeenCalledTimes(1);
        expect(joinRoom).toHaveBeenCalledWith(1, "room-1");
        expect(controlCurrentQuestion).toHaveBeenCalledWith({
            roomId: "room-1",
            deleteExternalElements: true,
            scrollToContent: false,
        });
        expect(replaceRoomUrl).toHaveBeenCalledWith("room-1");

        const listener = connectListener;
        if (!listener) {
            throw new Error("接続リスナーが登録されていません。");
        }

        await act(async () => {
            listener();
            await flushAsyncWork();
        });

        expect(joinRoom).toHaveBeenCalledTimes(2);
        expect(joinRoom).toHaveBeenLastCalledWith(1, "room-1", {
            answerBarPositions: [],
            elements: [],
        });
        expect(controlCurrentQuestion).toHaveBeenCalledTimes(1);
        expect(getInitialRoomCommand).toHaveBeenCalledTimes(1);
    });

    test("問題 ID のない URL は現在問題への削除・スクロール要求として送信すること", async () => {
        getInitialRoomCommand.mockReturnValue({
            roomId: "room-1",
            deleteExternalElements: true,
            scoreReset: false,
        });

        await renderAndFlush(root);

        expect(controlCurrentQuestion).toHaveBeenCalledWith({
            roomId: "room-1",
            deleteExternalElements: true,
            scrollToContent: false,
        });
        expect(replaceRoomUrl).toHaveBeenCalledWith("room-1");
    });

    test("scoreReset=true は問題適用と独立して作成者の得点リセットを要求すること", async () => {
        getInitialRoomCommand.mockReturnValue({
            roomId: "room-1",
            deleteExternalElements: false,
            scoreReset: true,
        });

        await renderAndFlush(root);

        expect(resetScores).toHaveBeenCalledWith("room-1");
        expect(replaceRoomUrl).toHaveBeenCalledWith("room-1");
    });

    test("scoreSetUser と scoreSetValue が指定された URL は得点補正を要求すること", async () => {
        getInitialRoomCommand.mockReturnValue({
            roomId: "room-1",
            deleteExternalElements: false,
            scoreReset: false,
            scoreSetUser: 2,
            scoreSetValue: 100,
        });

        await renderAndFlush(root);

        expect(setUserScore).toHaveBeenCalledWith("room-1", 2, 100);
        expect(replaceRoomUrl).toHaveBeenCalledWith("room-1");
    });

    test("初期 URL を読む前に URL 制御の実行許可を待つこと", async () => {
        let resolveReadiness: (() => void) | undefined;
        waitForInitialUrlControlReadiness.mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveReadiness = resolve;
                }),
        );

        await renderAndFlush(root);

        expect(waitForInitialUrlControlReadiness).toHaveBeenCalledTimes(1);
        expect(getInitialRoomCommand).not.toHaveBeenCalled();
        expect(getUser).not.toHaveBeenCalled();
        expect(joinRoom).not.toHaveBeenCalled();
        expect(controlCurrentQuestion).not.toHaveBeenCalled();

        if (!resolveReadiness) {
            throw new Error("URL 制御の実行許可を解決できません。");
        }
        const resolveInitialUrlControlReadiness = resolveReadiness;

        await act(async () => {
            resolveInitialUrlControlReadiness();
            await flushAsyncWork();
        });

        expect(getInitialRoomCommand).toHaveBeenCalledTimes(1);
        expect(getUser).toHaveBeenCalledWith(1);
        expect(joinRoom).toHaveBeenCalledWith(1, "room-1");
        expect(controlCurrentQuestion).toHaveBeenCalledTimes(1);
    });
});

async function renderAndFlush(root: Root): Promise<void> {
    await act(async () => {
        root.render(<RoomConnectionHarness />);
        await flushAsyncWork();
    });
}

async function flushAsyncWork(): Promise<void> {
    for (let index = 0; index < 10; index += 1) {
        await Promise.resolve();
    }
}
