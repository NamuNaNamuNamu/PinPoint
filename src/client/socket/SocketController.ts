import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { UserParams } from "../../server/features/user/User";
import type { AnswerBarPositionUpdateRequest } from "../../shared/answerBar/AnswerBarEvents";
import type { Cursor } from "../../shared/excalidraw/Cursor";
import type {
    ApplyQuestionRequest,
    ApplyQuestionResult,
    ControlCurrentQuestionRequest,
} from "../../shared/question/QuestionEvents";
import type { JoinRoomRequest } from "../../shared/room/RoomEvents";
import { SocketEvents } from "../../shared/SocketEvents";
import type { UpdateSocketIdRequest } from "../../shared/user/UserEvents";
import { socket } from "./socket";

/**
 * 要素同期を送信する最大頻度。
 */
const SYNC_ELEMENTS_INTERVAL_MS = 1000 / 30;

/**
 * クライアントから Socket.IO のイベントを送信する。
 */
class SocketController {
    /**
     * 次回の要素同期で送信する、最新の Excalidraw 要素。
     */
    private pendingSyncElements: readonly ExcalidrawElement[] | undefined;
    /**
     * 要素同期を最後に送信した時刻。
     */
    private lastSyncElementsSentAt: number | undefined;
    /**
     * 次回の要素同期を予約するタイマー。
     */
    private syncElementsTimer: ReturnType<typeof setTimeout> | undefined;
    private pendingAnswerBarPositions = new Map<string, AnswerBarPositionUpdateRequest>();
    private lastAnswerBarPositionSentAt: number | undefined;
    private answerBarPositionTimer: ReturnType<typeof setTimeout> | undefined;

    /**
     * Socket.IO の接続完了時に呼び出すリスナーを登録する。
     *
     * @param listener 接続完了時に実行する処理。
     * @returns 登録したリスナーを解除する関数。
     */
    public onConnect(listener: () => void): () => void {
        socket.on("connect", listener);

        return () => {
            socket.off("connect", listener);
        };
    }

    /**
     * Socket.IO 切断時の通知リスナーを登録する。
     *
     * @param listener 切断時に実行する処理。
     * @returns 登録したリスナーを解除する関数。
     */
    public onDisconnect(listener: () => void): () => void {
        socket.on("disconnect", listener);
        return () => socket.off("disconnect", listener);
    }

    /**
     * 現在の Socket.IO 接続が確立済みかを返す。
     *
     * @returns 接続済みの場合は `true`。
     */
    public isConnected(): boolean {
        return socket.connected;
    }

    /**
     * 現在の Socket.IO 接続 ID を取得する。
     *
     * @returns 未接続の場合は `undefined`。
     */
    public getSocketId(): string | undefined {
        return socket.id;
    }

    /**
     * ユーザー登録を要求する。
     *
     * @param userName 登録するユーザー名。
     * @returns 登録されたユーザー情報。
     */
    public registerUser(userName: string): Promise<UserParams> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.REGISTER_USER, userName, (response: UserParams) => {
                resolve(response);
            });
        });
    }

    /**
     * 指定した ID のユーザー情報を取得する。
     *
     * @param userId 取得するユーザー ID。
     * @returns ユーザー情報。見つからない場合は `undefined`。
     */
    public getUser(userId: number | undefined): Promise<UserParams | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.GET_USER, userId, (response: UserParams | undefined) => {
                resolve(response);
            });
        });
    }

    /**
     * ユーザーに紐付く Socket.IO 接続 ID を現在の接続 ID へ更新する。
     *
     * @param userId 更新するユーザー ID。
     * @returns 更新後のユーザー情報。ユーザーが見つからない場合は `undefined`。
     */
    public updateSocketId(userId: number | undefined): Promise<UserParams | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(
                SocketEvents.UPDATE_SOCKET_ID,
                { userId } satisfies UpdateSocketIdRequest,
                (response: UserParams | undefined) => {
                    resolve(response);
                },
            );
        });
    }

    /**
     * 接続中のユーザー名を更新する。
     *
     * @param userName 更新するユーザー名。
     * @returns 更新後のユーザー情報。更新に失敗した場合は `undefined`。
     */
    public updateUserName(userName: string): Promise<UserParams | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.UPDATE_USER_NAME, userName, (response: UserParams | undefined) => {
                resolve(response);
            });
        });
    }

    /**
     * 新しいルームの作成を要求する。
     *
     * @returns 作成されたルーム。
     */
    public createRoom(): Promise<any> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.CREATE_ROOM, "", (response: any) => {
                resolve(response);
            });
        });
    }

    /**
     * ユーザーを指定したルームへ参加させる。
     *
     * @param userId 参加するユーザー ID。
     * @param roomId 参加先のルーム ID。
     * @param recovery 再接続時に送るローカル状態。初回参加時は省略する。
     * @returns 参加したルーム ID。参加に失敗した場合は `null`。
     */
    public joinRoom(userId: number, roomId: string, recovery?: JoinRoomRequest["recovery"]): Promise<string | null> {
        console.log(`roomId: ${roomId} に参加しようとしています。\nsocketId: ${socket.id}`);
        return new Promise((resolve, _reject) => {
            socket.emit(
                SocketEvents.JOIN_ROOM,
                { userId, roomId, recovery } satisfies JoinRoomRequest,
                (response: string | null) => {
                    resolve(response);
                },
            );
        });
    }

    /**
     * 現在の接続を指定したルームから退出させる。
     *
     * @param roomId 退出するルーム ID。
     * @returns 退出したルーム ID。退出に失敗した場合は `null`。
     */
    public leaveRoom(roomId: string): Promise<string | null> {
        console.log(`roomId: ${roomId} から退出しようとしています。\nsocketId: ${socket.id}`);
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.LEAVE_ROOM, roomId, (response: string | null) => {
                resolve(response);
            });
        });
    }

    /**
     * 現在の接続が所属するルーム ID を取得する。
     *
     * @returns ルーム ID。所属していない場合は `undefined`。
     */
    public getRoomId(): Promise<string | undefined> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.GET_ROOM_ID, "", (response: string | undefined) => {
                resolve(response);
            });
        });
    }

    /**
     * 作成者として問題適用を要求する。
     *
     * @param request 適用する問題と外部要素削除指定。
     * @returns サーバーによる受理または拒否の結果。
     */
    public applyQuestion(request: ApplyQuestionRequest): Promise<ApplyQuestionResult> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.APPLY_QUESTION, request, (response: ApplyQuestionResult) => {
                resolve(response);
            });
        });
    }

    /**
     * 現在問題に対する管理外要素削除・スクロールを要求する。
     *
     * @param request 操作対象のルームと実行内容。
     * @returns サーバーによる受理または拒否の結果。
     */
    public controlCurrentQuestion(request: ControlCurrentQuestionRequest): Promise<ApplyQuestionResult> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.CONTROL_CURRENT_QUESTION, request, (response: ApplyQuestionResult) => {
                resolve(response);
            });
        });
    }

    /**
     * 作成者としてルームの累積得点リセットを要求する。
     *
     * @param roomId リセット対象ルーム ID。
     * @returns サーバーによる受理または拒否の結果。
     */
    public resetScores(roomId: string): Promise<ApplyQuestionResult> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.RESET_SCORES, { roomId }, (response: ApplyQuestionResult) => {
                resolve(response);
            });
        });
    }

    /**
     * 得点一覧の表示可否を作成者として変更する。
     *
     * @param roomId 対象ルーム ID。
     * @param enabled 更新後の表示可否。
     * @returns サーバーによる受理または拒否の結果。
     */
    public setScoreListEnabled(roomId: string, enabled: boolean): Promise<ApplyQuestionResult> {
        return new Promise((resolve, _reject) => {
            socket.emit(SocketEvents.SET_SCORE_LIST_ENABLED, { roomId, enabled }, (response: ApplyQuestionResult) => {
                resolve(response);
            });
        });
    }

    /**
     * 共有カーソルの公開状態を作成者として変更する。
     *
     * @param roomId 対象ルーム ID。
     * @param cursorRevealed 更新後の共有カーソル公開状態。
     * @returns サーバーによる受理または拒否の結果。
     */
    public setCursorRevealed(roomId: string, cursorRevealed: boolean): Promise<ApplyQuestionResult> {
        return new Promise((resolve, _reject) => {
            socket.emit(
                SocketEvents.SET_CURSOR_REVEALED,
                { roomId, cursorRevealed },
                (response: ApplyQuestionResult) => {
                    resolve(response);
                },
            );
        });
    }

    /**
     * 作成者として現在の問題の正解表示を要求する。
     *
     * @param roomId 正解表示の対象ルーム ID。
     */
    public revealQuestion(roomId: string): void {
        socket.emit(SocketEvents.REVEAL_QUESTION, { roomId });
    }

    /**
     * Excalidraw 要素を最大毎秒 30 回で他のクライアントへ同期する。
     *
     * 送信間隔内に複数回呼び出された場合は、最後に受け取った要素だけを送信する。
     *
     * @param elements 同期する Excalidraw 要素。
     */
    public syncElements(elements: readonly ExcalidrawElement[]): void {
        this.pendingSyncElements = elements;

        const delay = this.getSyncElementsDelay();
        if (delay === 0) {
            this.sendPendingSyncElements();
            return;
        }

        if (this.syncElementsTimer !== undefined) {
            return;
        }

        this.syncElementsTimer = setTimeout(() => {
            this.syncElementsTimer = undefined;
            this.sendPendingSyncElements();
        }, delay);
    }

    /**
     * 所有する AnswerBar の最新 X 座標を、専用イベントで最大毎秒 30 回サーバーへ送信する。
     *
     * 同じ line ID の送信待ちデータは最新値で置き換える。送信間隔内の複数 line ID は、
     * 次回の送信時にそれぞれ 1 件ずつ送信する。
     *
     * @param position AnswerBar ID、line ID、正規化済み X 座標を含む位置更新要求。
     */
    public syncAnswerBarPosition(position: AnswerBarPositionUpdateRequest): void {
        this.pendingAnswerBarPositions.set(position.lineId, position);
        const delay =
            this.lastAnswerBarPositionSentAt === undefined
                ? 0
                : Math.max(0, SYNC_ELEMENTS_INTERVAL_MS - (performance.now() - this.lastAnswerBarPositionSentAt));
        if (delay === 0) {
            this.sendPendingAnswerBarPositions();
        } else if (this.answerBarPositionTimer === undefined) {
            this.answerBarPositionTimer = setTimeout(() => {
                this.answerBarPositionTimer = undefined;
                this.sendPendingAnswerBarPositions();
            }, delay);
        }
    }

    /**
     * 保持中の AnswerBar 位置更新を専用イベントで送信する。
     *
     * 送信対象がない場合は何もしない。
     */
    private sendPendingAnswerBarPositions(): void {
        if (this.pendingAnswerBarPositions.size === 0) {
            return;
        }
        this.lastAnswerBarPositionSentAt = performance.now();
        this.pendingAnswerBarPositions.forEach((position) =>
            socket.emit(SocketEvents.ANSWER_BAR_POSITION_UPDATE, position),
        );
        this.pendingAnswerBarPositions.clear();
    }

    /**
     * 次回の要素同期を送信できるまでの待ち時間を取得する。
     *
     * @returns 待ち時間（ミリ秒）。直ちに送信できる場合は `0`。
     */
    private getSyncElementsDelay(): number {
        if (this.lastSyncElementsSentAt === undefined) {
            return 0;
        }

        return Math.max(0, SYNC_ELEMENTS_INTERVAL_MS - (performance.now() - this.lastSyncElementsSentAt));
    }

    /**
     * 保持している最新の要素同期を送信する。
     */
    private sendPendingSyncElements(): void {
        const elements = this.pendingSyncElements;
        if (!elements) {
            return;
        }

        this.pendingSyncElements = undefined;
        this.lastSyncElementsSentAt = performance.now();
        socket.emit(SocketEvents.SYNC_ELEMENTS, elements);
    }

    /**
     * 現在のカーソルをサーバーへ送信する。
     *
     * @param cursor 座標とボタン状態。接続 ID と表示名はサーバーが付加する。
     */
    public syncCursor(cursor: Cursor): void {
        socket.emit(SocketEvents.SYNC_CURSOR, cursor);
    }
}

export const socketController = new SocketController();
