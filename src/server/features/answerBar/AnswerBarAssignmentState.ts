import { randomUUID } from "node:crypto";

import type { AnswerBarAdded, AnswerBarRemoved } from "../../../shared/answerBar/AnswerBarEvents";

/**
 * AnswerBar の割当先となるルーム ID。
 */
type RoomId = string;
/**
 * AnswerBar を所有するユーザー ID。
 */
type OwnerUserId = number;
/**
 * 同一ルーム内での AnswerBar の表示位置を示す論理スロット。
 */
type AnswerBarSlot = number;

/**
 * 切断保留状態を含む、サーバー内部の AnswerBar 割当。
 */
type AnswerBarAssignment = {
    answerBarId: string;
    ownerUserId: OwnerUserId;
    ownerUserName: string;
    slot: AnswerBarSlot;
    lineIds: readonly string[];
    labelIds: readonly string[];
    disconnectedAt: number | null;
    disconnectedToken: string | null;
};

/**
 * 同一ルーム内の AnswerBar 割当を、所有ユーザー ID ごとに管理する。
 */
class RoomAssignments {
    private readonly assignmentsByOwnerUserId = new Map<OwnerUserId, AnswerBarAssignment>();

    /**
     * 所有ユーザー ID に対応する割当を取得する。
     *
     * @param ownerUserId 検索する所有ユーザー ID。
     * @returns 割当。存在しない場合は `undefined`。
     */
    public getByOwnerUserId(ownerUserId: OwnerUserId): AnswerBarAssignment | undefined {
        return this.assignmentsByOwnerUserId.get(ownerUserId);
    }

    /**
     * 割当を保存する。
     *
     * @param assignment 保存する割当。
     */
    public set(assignment: AnswerBarAssignment): void {
        this.assignmentsByOwnerUserId.set(assignment.ownerUserId, assignment);
    }

    /**
     * 所有ユーザー ID に対応する割当を削除する。
     *
     * @param ownerUserId 削除する所有ユーザー ID。
     */
    public deleteByOwnerUserId(ownerUserId: OwnerUserId): void {
        this.assignmentsByOwnerUserId.delete(ownerUserId);
    }

    /**
     * このルームにある全割当を取得する。
     *
     * @returns このルームにある全割当。
     */
    public getAll(): readonly AnswerBarAssignment[] {
        return [...this.assignmentsByOwnerUserId.values()];
    }

    /**
     * 既存割当が使用している slot の一覧を取得する。
     *
     * @returns 既存割当が使用している slot の一覧。
     */
    public getUsedSlots(): ReadonlySet<AnswerBarSlot> {
        return new Set(this.getAll().map((assignment) => assignment.slot));
    }
}

/**
 * room / user ごとの AnswerBar 割当、slot、切断保留を保持する。
 */
export class AnswerBarAssignmentState {
    private readonly assignmentsByRoomId = new Map<RoomId, RoomAssignments>();
    /**
     * 一度でも AnswerBar に割り当てた scene 要素 ID。削除後の古い scene 同期を識別する。
     */
    private readonly knownElementIdsByRoomId = new Map<RoomId, Set<string>>();

    /**
     * ルーム内のすべての公開割当を取得する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 追加通知用の公開割当。
     */
    public getAll(roomId: RoomId): readonly AnswerBarAdded[] {
        return (this.assignmentsByRoomId.get(roomId)?.getAll() ?? []).map((assignment) =>
            this.toAddedEvent(assignment),
        );
    }

    /**
     * ユーザーの割当を取得し、存在しなければ新規作成する。
     *
     * @param roomId 割当先のルーム ID。
     * @param ownerUserId AnswerBar の所有者 ID。
     * @param ownerUserName AnswerBar のそばに表示する所有者名。
     * @param sliderCount 割り当てる Slider の件数。
     * @returns 割当と、新規に作成したかどうか。
     */
    public getOrCreate(
        roomId: RoomId,
        ownerUserId: OwnerUserId,
        ownerUserName: string,
        sliderCount: number,
    ): { assignment: AnswerBarAdded; isNew: boolean } {
        const roomAssignments = this.getOrCreateRoomAssignments(roomId);
        const existing = roomAssignments.getByOwnerUserId(ownerUserId);
        if (existing) {
            existing.disconnectedAt = null;
            existing.disconnectedToken = null;
            return { assignment: this.toAddedEvent(existing), isNew: false };
        }

        const assignment: AnswerBarAssignment = {
            answerBarId: randomUUID(),
            ownerUserId,
            ownerUserName,
            slot: this.getSmallestUnusedSlot(roomAssignments.getUsedSlots()),
            lineIds: Array.from({ length: sliderCount }, () => randomUUID()),
            labelIds: Array.from({ length: sliderCount }, () => randomUUID()),
            disconnectedAt: null,
            disconnectedToken: null,
        };
        roomAssignments.set(assignment);
        const knownElementIds = this.getOrCreateKnownElementIds(roomId);
        assignment.lineIds.forEach((id) => knownElementIds.add(id));
        assignment.labelIds.forEach((id) => knownElementIds.add(id));
        return { assignment: this.toAddedEvent(assignment), isNew: true };
    }

    /**
     * 切断時刻と世代トークンを記録し、再接続前の期限処理を識別できるようにする。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 対象ユーザー ID。
     * @returns 保留世代トークン。割当がない場合は `null`。
     */
    public markDisconnected(roomId: RoomId, userId: OwnerUserId): string | null {
        const assignment = this.assignmentsByRoomId.get(roomId)?.getByOwnerUserId(userId);
        if (!assignment) {
            return null;
        }

        assignment.disconnectedAt = Date.now();
        assignment.disconnectedToken = randomUUID();
        return assignment.disconnectedToken;
    }

    /**
     * 指定トークンの切断保留が継続している場合にだけ割当を削除する。
     *
     * 再接続でトークンが無効化された割当を、以前のタイマーが削除しないために使用する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 対象ユーザー ID。
     * @param token 切断保留時の世代トークン。
     * @returns 削除イベント。削除しなかった場合は `null`。
     */
    public removeIfStillDisconnected(roomId: RoomId, userId: OwnerUserId, token: string): AnswerBarRemoved | null {
        const roomAssignments = this.assignmentsByRoomId.get(roomId);
        const assignment = roomAssignments?.getByOwnerUserId(userId);
        if (!assignment || assignment.disconnectedAt === null || assignment.disconnectedToken !== token) {
            return null;
        }

        roomAssignments?.deleteByOwnerUserId(userId);
        return this.toRemovedEvent(assignment);
    }

    /**
     * ユーザーの割当を直ちに削除する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 対象ユーザー ID。
     * @returns 削除イベント。割当がない場合は `null`。
     */
    public remove(roomId: RoomId, userId: OwnerUserId): AnswerBarRemoved | null {
        const roomAssignments = this.assignmentsByRoomId.get(roomId);
        const assignment = roomAssignments?.getByOwnerUserId(userId);
        if (!assignment) {
            return null;
        }

        roomAssignments?.deleteByOwnerUserId(userId);
        return this.toRemovedEvent(assignment);
    }

    /**
     * AnswerBar として既知だが、現在の割当に存在しない要素を scene 同期から除外する。
     *
     * 削除通知より前に生成された古い `SYNC_ELEMENTS` を別のクライアントが送っても、
     * 退出済み AnswerBar と名前ラベルが再生成されないようにする。
     *
     * @param roomId 対象ルーム ID。
     * @param elements 同期対象の要素。
     */
    public excludeInactiveAnswerBarElements<T extends { id: string }>(
        roomId: RoomId,
        elements: readonly T[],
    ): readonly T[] {
        const knownElementIds = this.knownElementIdsByRoomId.get(roomId);
        if (!knownElementIds) {
            return elements;
        }

        const activeElementIds = new Set(
            this.getAll(roomId).flatMap((assignment) => [...assignment.lineIds, ...assignment.labelIds]),
        );
        return elements.filter((element) => {
            if (!knownElementIds.has(element.id)) {
                return true;
            }
            return activeElementIds.has(element.id) && !("isDeleted" in element && element.isDeleted === true);
        });
    }

    /**
     * 指定したルームの AnswerBar 割当管理を取得し、存在しない場合は新規作成する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 指定ルームの AnswerBar 割当管理。
     */
    private getOrCreateRoomAssignments(roomId: RoomId): RoomAssignments {
        const existing = this.assignmentsByRoomId.get(roomId);
        if (existing) {
            return existing;
        }

        const roomAssignments = new RoomAssignments();
        this.assignmentsByRoomId.set(roomId, roomAssignments);
        return roomAssignments;
    }

    /**
     * 指定したルームで既知の AnswerBar 要素 ID 集合を取得し、存在しない場合は新規作成する。
     *
     * @param roomId 対象ルーム ID。
     * @returns 指定ルームで既知の AnswerBar 要素 ID 集合。
     */
    private getOrCreateKnownElementIds(roomId: RoomId): Set<string> {
        const existing = this.knownElementIdsByRoomId.get(roomId);
        if (existing) {
            return existing;
        }

        const knownElementIds = new Set<string>();
        this.knownElementIdsByRoomId.set(roomId, knownElementIds);
        return knownElementIds;
    }

    /**
     * 未使用 slot のうち最小のものを返す。
     *
     * @param usedSlots 既に使用済みの slot。
     * @returns 割当可能な最小 slot。
     */
    private getSmallestUnusedSlot(usedSlots: ReadonlySet<AnswerBarSlot>): AnswerBarSlot {
        let slot = 0;
        while (usedSlots.has(slot)) {
            slot++;
        }
        return slot;
    }

    /**
     * 内部の AnswerBar 割当から、追加通知用の公開ペイロードを作成する。
     *
     * @param assignment 変換する内部の AnswerBar 割当。
     * @returns 追加通知用の公開ペイロード。
     */
    private toAddedEvent(assignment: AnswerBarAssignment): AnswerBarAdded {
        const { disconnectedAt: _disconnectedAt, disconnectedToken: _disconnectedToken, ...event } = assignment;
        return event;
    }

    /**
     * 内部の AnswerBar 割当から、削除通知用の公開ペイロードを作成する。
     *
     * @param assignment 変換する内部の AnswerBar 割当。
     * @returns 削除通知用の公開ペイロード。
     */
    private toRemovedEvent(assignment: AnswerBarAssignment): AnswerBarRemoved {
        return {
            answerBarId: assignment.answerBarId,
            lineIds: assignment.lineIds,
            labelIds: assignment.labelIds,
        };
    }
}

export const answerBarAssignmentState = new AnswerBarAssignmentState();
