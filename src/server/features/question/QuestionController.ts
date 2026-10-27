import type { Socket } from "socket.io";

import type {
    ApplyQuestionRequest,
    ApplyQuestionResult,
    ControlCurrentQuestionRequest,
    QuestionApplied,
} from "../../../shared/question/QuestionEvents";
import { getAllQuestionManagedElementIds } from "../../../shared/question/QuestionManagedElementIds";
import { getQuestionTemplate } from "../../../shared/question/QuestionTemplate";
import { SocketEvents } from "../../../shared/SocketEvents";
import { answerBarAssignmentState } from "../answerBar/AnswerBarAssignmentState";
import { roomController } from "../room/RoomController";
import { userService } from "../user/UserService";
import { scoreState } from "../score/ScoreState";

/**
 * ルームの問題適用と正解表示を処理する。
 */
class QuestionController {
    /**
     * サーバー管理要素を通常の Excalidraw 同期から除外する。
     *
     * @param roomId 対象ルーム ID。
     * @param elements 同期候補の要素。
     * @returns 問題管理要素を含まない要素。
     */
    public excludeManagedElements<T extends { id: string }>(roomId: string, elements: readonly T[]): readonly T[] {
        const questionId = roomController.getRoom(roomId)?.getCurrentQuestionId();
        if (questionId === undefined) {
            return elements;
        }
        const ids = getAllQuestionManagedElementIds();
        return elements.filter((element) => !ids.has(element.id));
    }

    /**
     * 作成者からの問題適用を検証し、同一ルームへ新しい問題状態を配布する。
     *
     * @param socket 要求元の Socket.IO 接続。
     * @param userId 要求元ユーザー ID。
     * @param request 適用要求。
     * @returns 受理結果。拒否時は room 状態を変更しない。
     */
    public apply(
        socket: Socket,
        userId: number | undefined,
        request: ApplyQuestionRequest | undefined,
    ): ApplyQuestionResult {
        if (
            !request ||
            userId === undefined ||
            (request.deleteExternalElements !== true && request.deleteExternalElements !== false) ||
            (request.scrollToContent !== undefined && typeof request.scrollToContent !== "boolean")
        ) {
            return { ok: false, reason: "invalid-request" };
        }
        const room = roomController.getRoom(request.roomId);
        if (!room) {
            return { ok: false, reason: "room-not-found" };
        }
        const question = Number.isInteger(request.questionId) ? getQuestionTemplate(request.questionId) : undefined;
        if (!question) {
            return { ok: false, reason: "question-not-found" };
        }
        if (!room.isCreatedBy(userId)) {
            return { ok: false, reason: "not-creator" };
        }
        if (!room.hasUser(userId)) {
            return { ok: false, reason: "not-member" };
        }

        room.setCurrentQuestionId(question.id);
        const users = room.getUserIds().flatMap((participantUserId) => {
            if (room.isCreatedBy(participantUserId)) {
                return [];
            }
            const user = userService.getUser(participantUserId);
            return user ? [{ userId: participantUserId, userName: user.getName() }] : [];
        });
        const answerBars = answerBarAssignmentState.reset(request.roomId, users, question.sliders.length);
        scoreState.prepareQuestion(request.roomId, question, answerBars);
        const payload: QuestionApplied = {
            question,
            answerBars,
            deleteExternalElements: request.deleteExternalElements,
            scrollToContent: request.scrollToContent ?? false,
        };
        socket.nsp.to(request.roomId).emit(SocketEvents.QUESTION_APPLIED, payload);
        return { ok: true };
    }

    /**
     * 作成者からの正解表示を検証し、現在の問題を表示状態へ切り替える。
     *
     * @param socket 要求元の Socket.IO 接続。
     * @param userId 要求元ユーザー ID。
     * @param roomId 対象ルーム ID。
     */
    public reveal(socket: Socket, userId: number | undefined, roomId: string | undefined): void {
        if (userId === undefined || !roomId) {
            return;
        }
        const room = roomController.getRoom(roomId);
        const questionId = room?.getCurrentQuestionId();
        if (!room || questionId === undefined || !room.isCreatedBy(userId) || !room.hasUser(userId)) {
            return;
        }
        if (room.isAnswerRevealed()) {
            return;
        }
        room.revealAnswer();
        const scores = scoreState.addQuestionScores(roomId, getQuestionTemplate(questionId)!, answerBarAssignmentState.getAll(roomId));
        socket.nsp.to(roomId).emit(SocketEvents.QUESTION_REVEALED, { questionId });
        socket.nsp.to(roomId).emit(SocketEvents.SCORES_UPDATED, { scores, reason: "scored" });
    }

    /**
     * 作成者の要求により累積得点を 0 に戻してルームへ通知する。
     *
     * @param socket 要求元の Socket.IO 接続。
     * @param userId 要求元ユーザー ID。
     * @param roomId リセット対象ルーム ID。
     * @returns 受理結果。作成者以外の要求は状態を変更しない。
     */
    public resetScores(socket: Socket, userId: number | undefined, roomId: string | undefined): ApplyQuestionResult {
        if (userId === undefined || !roomId) {
            return { ok: false, reason: "invalid-request" };
        }
        const room = roomController.getRoom(roomId);
        if (!room) {
            return { ok: false, reason: "room-not-found" };
        }
        if (!room.isCreatedBy(userId)) {
            return { ok: false, reason: "not-creator" };
        }
        const scores = scoreState.reset(roomId);
        socket.nsp.to(roomId).emit(SocketEvents.SCORES_UPDATED, { scores, reason: "reset" });
        return { ok: true };
    }

    /**
     * 作成者の要求により得点一覧の表示可否を更新する。
     *
     * @param socket 要求元の Socket.IO 接続。
     * @param userId 要求元ユーザー ID。
     * @param roomId 対象ルーム ID。
     * @param enabled 更新後の表示可否。
     * @returns 受理結果。状態が同じ場合は通知せず成功する。
     */
    public setScoreListEnabled(
        socket: Socket,
        userId: number | undefined,
        roomId: string | undefined,
        enabled: unknown,
    ): ApplyQuestionResult {
        if (userId === undefined || !roomId || typeof enabled !== "boolean") {
            return { ok: false, reason: "invalid-request" };
        }
        const room = roomController.getRoom(roomId);
        if (!room) {
            return { ok: false, reason: "room-not-found" };
        }
        if (!room.isCreatedBy(userId)) {
            return { ok: false, reason: "not-creator" };
        }
        if (!room.hasUser(userId)) {
            return { ok: false, reason: "not-member" };
        }
        if (room.setScoreListEnabled(enabled)) {
            socket.nsp.to(roomId).emit(SocketEvents.SCORE_LIST_ENABLED_UPDATED, { enabled });
        }
        return { ok: true };
    }

    /**
     * 作成者の要求により、現在問題の管理外要素削除または全参加者のスクロールを実行する。
     *
     * @param socket 要求元の Socket.IO 接続。
     * @param userId 要求元ユーザー ID。
     * @param request 現在問題への操作内容。
     * @returns 受理結果。現在問題がない場合は問題未検出として拒否する。
     */
    public controlCurrent(
        socket: Socket,
        userId: number | undefined,
        request: ControlCurrentQuestionRequest | undefined,
    ): ApplyQuestionResult {
        if (
            !request ||
            userId === undefined ||
            (request.deleteExternalElements !== true && request.deleteExternalElements !== false) ||
            (request.scrollToContent !== true && request.scrollToContent !== false)
        ) {
            return { ok: false, reason: "invalid-request" };
        }
        const room = roomController.getRoom(request.roomId);
        if (!room) {
            return { ok: false, reason: "room-not-found" };
        }
        if (!room.isCreatedBy(userId)) {
            return { ok: false, reason: "not-creator" };
        }
        const questionId = room.getCurrentQuestionId();
        const question = questionId === undefined ? undefined : getQuestionTemplate(questionId);
        if (!question) {
            return { ok: false, reason: "question-not-found" };
        }

        if (request.deleteExternalElements) {
            socket.nsp.to(request.roomId).emit(SocketEvents.QUESTION_REMOVE_EXTERNAL_ELEMENTS);
            if (room.isAnswerRevealed()) {
                socket.nsp.to(request.roomId).emit(SocketEvents.QUESTION_REVEALED, { questionId });
            }
        }
        if (request.scrollToContent) {
            socket.nsp.to(request.roomId).emit(SocketEvents.QUESTION_SCROLL_TO_CONTENT);
        }
        return { ok: true };
    }

    /**
     * 途中参加者へ現在の問題状態を送信する。
     *
     * @param socket 通知先の Socket.IO 接続。
     * @param roomId 現在状態を取得するルーム ID。
     */
    public sendCurrent(socket: Socket, roomId: string): void {
        const room = roomController.getRoom(roomId);
        const questionId = room?.getCurrentQuestionId();
        if (!room) {
            return;
        }
        socket.emit(SocketEvents.SCORE_LIST_ENABLED_UPDATED, { enabled: room.isScoreListEnabled() });
        socket.emit(SocketEvents.SCORES_UPDATED, { scores: scoreState.get(roomId), reason: "snapshot" });
        if (questionId === undefined) {
            return;
        }
        const question = getQuestionTemplate(questionId);
        if (!question) {
            return;
        }
        socket.emit(SocketEvents.QUESTION_APPLIED, {
            question,
            answerBars: answerBarAssignmentState.getAll(roomId),
            deleteExternalElements: false,
            scrollToContent: true,
        } satisfies QuestionApplied);
        if (room.isAnswerRevealed()) {
            socket.emit(SocketEvents.QUESTION_REVEALED, { questionId });
        }
    }
}

export const questionController = new QuestionController();
