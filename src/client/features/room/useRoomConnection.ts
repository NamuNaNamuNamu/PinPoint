import { useCallback, useEffect, useRef, useState } from "react";

import { socketController } from "../../socket/SocketController";
import { answerBarSceneController } from "../answerBar/AnswerBarSceneController";
import { registerAnswerBarListener } from "../answerBar/registerAnswerBarListener";
import { excalidrawAPIHolder } from "../excalidraw/ExcalidrawAPIHolder";
import { registerQuestionListener } from "../question/registerQuestionListener";
import { registerScoreListener } from "../score/registerScoreListener";
import { registerScoreListListener } from "../score/registerScoreListListener";
import { userSessionStorage } from "../sessionStorage/sessionStorage";
import { type InitialRoomCommand, url } from "../url/Url";
import { waitForInitialUrlControlReadiness } from "../url/waitForInitialUrlControlReadiness";
import { joinRoom } from "./joinRoom";
import { roomRoleStore } from "./roomRoleStore";

type Props = {
    enabled: boolean;
};

export interface RoomConnection {
    /**
     * 接続済み・再接続中・再参加不能のいずれかを示す。
     */
    readonly connectionStatus: "connected" | "reconnecting" | "left";
    /**
     * 現在参加中のルーム ID。
     *
     * 未参加の場合は `undefined`。
     */
    readonly currentRoomId: string | undefined;

    /**
     * 現在のルーム ID を更新する。
     *
     * @param roomId 参加成功後のルーム ID。未参加へ戻す場合は `undefined`。
     */
    onCurrentRoomIdChange(roomId: string | undefined): void;

    /**
     * 現在の操作ユーザー ID を取得する。
     *
     * @returns 初期化または接続復元前は `undefined`。
     */
    getOperatorUserId(): number | undefined;
}

/**
 * Socket.IO 接続、ルーム入室、および初期 URL コマンドを管理する。
 *
 * 初期 URL コマンドは、実行許可条件を満たした初回の Effect で一度だけ読み取り、接続復旧を待って実行する。
 * 以後の Socket.IO 再接続では、ユーザーとルームを復元するだけで URL コマンドは再実行しない。
 *
 * @param props Excalidraw API の準備状態。
 * @returns 現在のルーム ID、更新関数、および操作ユーザー ID の取得関数。
 */
export function useRoomConnection({ enabled }: Props): RoomConnection {
    const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();
    const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting" | "left">("connected");
    const currentRoomIdRef = useRef<string | undefined>(undefined);
    const hasStartedInitialNavigationRef = useRef(false);
    const hasCompletedInitialNavigationRef = useRef(false);
    const operatorUserIdRef = useRef<number | undefined>(undefined);

    const onCurrentRoomIdChange = useCallback((roomId: string | undefined) => {
        currentRoomIdRef.current = roomId;
        if (!roomId) roomRoleStore.set(false);
        setCurrentRoomId(roomId);
    }, []);

    const getOperatorUserId = useCallback(() => operatorUserIdRef.current, []);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const executeInitialRoomCommand = async (command: InitialRoomCommand): Promise<void> => {
            console.debug("[initial-room-command] sending", {
                url: window.location.href,
                socketId: socketController.getSocketId(),
                command,
            });

            if (command.deleteExternalElements) {
                const result = await socketController.controlCurrentQuestion({
                    roomId: command.roomId,
                    deleteExternalElements: true,
                    scrollToContent: false,
                });
                if (!result.ok) {
                    return;
                }
            }

            if (command.scoreReset) {
                const result = await socketController.resetScores(command.roomId);
                if (!result.ok) {
                    return;
                }
            }

            if (command.scoreSetUser !== undefined && command.scoreSetValue !== undefined) {
                const result = await socketController.setUserScore(
                    command.roomId,
                    command.scoreSetUser,
                    command.scoreSetValue,
                );
                if (!result.ok) return;
            }

            url.replaceRoomUrl(command.roomId);
        };

        const restoreUser = async (): Promise<number> => {
            const userId = userSessionStorage.getUserIdForCurrentNavigation();
            let user = await socketController.getUser(userId);

            if (user) {
                await socketController.updateSocketId(userId);
            } else {
                user = await socketController.registerUser("名無し");
                userSessionStorage.setUserId(user.id);
            }

            registerAnswerBarListener(user.id);
            registerQuestionListener(user.id);
            registerScoreListener();
            registerScoreListListener();
            operatorUserIdRef.current = user.id;

            return user.id;
        };

        const restoreConnection = async (): Promise<void> => {
            if (!hasCompletedInitialNavigationRef.current) {
                return;
            }

            const userId = await restoreUser();
            const roomId = currentRoomIdRef.current;
            if (!roomId) {
                return;
            }

            const joinedRoom = await joinRoom(userId, roomId, {
                answerBarPositions: answerBarSceneController.getOwnedPositionUpdates(),
                elements: excalidrawAPIHolder.getSceneElementsWithTombstones(),
            });
            onCurrentRoomIdChange(joinedRoom?.roomId);
            setConnectionStatus(joinedRoom ? "connected" : "left");
        };

        const initializeInitialNavigation = async (): Promise<void> => {
            await waitForInitialUrlControlReadiness();
            const command = url.getInitialRoomCommand();
            const userId = await restoreUser();

            if (!command) {
                hasCompletedInitialNavigationRef.current = true;
                return;
            }

            const joinedRoom = await joinRoom(userId, command.roomId);
            onCurrentRoomIdChange(joinedRoom?.roomId);
            if (!joinedRoom) {
                hasCompletedInitialNavigationRef.current = true;
                return;
            }

            if (command.roomId === joinedRoom.roomId) {
                await executeInitialRoomCommand(command);
            }

            hasCompletedInitialNavigationRef.current = true;
        };

        const removeConnectListener = socketController.onConnect(() => {
            void restoreConnection();
        });
        const removeDisconnectListener = socketController.onDisconnect(() => {
            if (currentRoomIdRef.current) setConnectionStatus("reconnecting");
        });
        const removeRoomKickedListener = socketController.onRoomKicked?.((message) => {
            if (message.roomId === currentRoomIdRef.current) {
                onCurrentRoomIdChange(undefined);
                setConnectionStatus("left");
            }
        });

        if (!hasStartedInitialNavigationRef.current) {
            hasStartedInitialNavigationRef.current = true;
            void initializeInitialNavigation();
        }

        return () => {
            removeConnectListener();
            removeDisconnectListener();
            removeRoomKickedListener?.();
        };
    }, [enabled, onCurrentRoomIdChange]);

    return { currentRoomId, connectionStatus, onCurrentRoomIdChange, getOperatorUserId };
}
