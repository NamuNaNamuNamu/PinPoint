import { useCallback, useEffect, useRef, useState } from "react";

import { socketController } from "../../socket/SocketController";
import { registerAnswerBarListener } from "../answerBar/registerAnswerBarListener";
import { registerQuestionListener } from "../question/registerQuestionListener";
import { registerScoreListener } from "../score/registerScoreListener";
import { userSessionStorage } from "../sessionStorage/sessionStorage";
import { type InitialRoomCommand, url } from "../url/Url";
import { waitForInitialUrlControlReadiness } from "../url/waitForInitialUrlControlReadiness";
import { joinRoom } from "./joinRoom";

type Props = {
    enabled: boolean;
};

export interface RoomConnection {
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
    const currentRoomIdRef = useRef<string | undefined>(undefined);
    const hasStartedInitialNavigationRef = useRef(false);
    const hasCompletedInitialNavigationRef = useRef(false);
    const operatorUserIdRef = useRef<number | undefined>(undefined);

    const onCurrentRoomIdChange = useCallback((roomId: string | undefined) => {
        currentRoomIdRef.current = roomId;
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

            if (command.questionId !== undefined) {
                const result = await socketController.applyQuestion({
                    roomId: command.roomId,
                    questionId: command.questionId,
                    deleteExternalElements: command.deleteExternalElements,
                    scrollToContent: command.scrollToContent,
                });
                console.debug("[initial-room-command] apply-question acknowledged", {
                    socketId: socketController.getSocketId(),
                    result,
                });
                if (!result.ok) {
                    return;
                }
            } else if (command.deleteExternalElements || command.hasScrollToContentParam) {
                const result = await socketController.controlCurrentQuestion({
                    roomId: command.roomId,
                    deleteExternalElements: command.deleteExternalElements,
                    scrollToContent: command.scrollToContent,
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

            if (command.reveal) {
                socketController.revealQuestion(command.roomId);
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

            const joinedRoomId = await joinRoom(userId, roomId);
            onCurrentRoomIdChange(joinedRoomId ?? undefined);
        };

        const initializeInitialNavigation = async (): Promise<void> => {
            await waitForInitialUrlControlReadiness();
            const command = url.getInitialRoomCommand();
            const userId = await restoreUser();

            if (!command) {
                hasCompletedInitialNavigationRef.current = true;
                return;
            }

            const joinedRoomId = await joinRoom(userId, command.roomId);
            onCurrentRoomIdChange(joinedRoomId ?? undefined);
            if (!joinedRoomId) {
                hasCompletedInitialNavigationRef.current = true;
                return;
            }

            if (command.roomId === joinedRoomId) {
                await executeInitialRoomCommand(command);
            }

            hasCompletedInitialNavigationRef.current = true;
        };

        const removeConnectListener = socketController.onConnect(() => {
            void restoreConnection();
        });

        if (!hasStartedInitialNavigationRef.current) {
            hasStartedInitialNavigationRef.current = true;
            void initializeInitialNavigation();
        }

        return removeConnectListener;
    }, [enabled, onCurrentRoomIdChange]);

    return { currentRoomId, onCurrentRoomIdChange, getOperatorUserId };
}
