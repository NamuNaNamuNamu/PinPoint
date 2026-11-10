import { randomUUID } from "node:crypto";

import type {
    AnswerBarAdded,
    AnswerBarOwnerNameUpdated,
    AnswerBarRemoved,
} from "../../../shared/answerBar/AnswerBarEvents";
import { getAnswerBarSlotRatio } from "../../../shared/answerBar/answerBarSlot";

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
    positionsByLineId: Record<string, number>;
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
     * 指定ルームの採点用 AnswerBar 位置を、line ID をキーとする読み取り専用 map として返す。
     *
     * 戻り値は内部 map の複製であるため、呼び出し側の変更は状態に影響しない。割当がない
     * 場合は空の map を返す。
     *
     * @param roomId 位置を取得するルーム ID。
     * @returns line ID ごとのサーバー受理済み X 座標。
     */
    public getPositionsByLineId(roomId: RoomId): ReadonlyMap<string, number> {
        return new Map(
            (this.assignmentsByRoomId.get(roomId)?.getAll() ?? []).flatMap((assignment) =>
                Object.entries(assignment.positionsByLineId),
            ),
        );
    }

    /**
     * ルーム削除時に、AnswerBar 割当と既知要素 ID を破棄する。
     *
     * @param roomId 削除されたルーム ID。
     */
    public clear(roomId: RoomId): void {
        this.assignmentsByRoomId.delete(roomId);
        this.knownElementIdsByRoomId.delete(roomId);
    }

    /**
     * 問題の Slider 構成に合わせ、既存参加者の slot を保ったまま AnswerBar を再発行する。
     *
     * @param roomId 対象ルーム ID。
     * @param users AnswerBar を割り当てる参加者。
     * @param sliders 問題が持つ Slider の X 座標と幅、または互換用の Slider 件数。
     * @returns 新しい割当一覧。
     */
    public reset(
        roomId: RoomId,
        users: readonly { userId: number; userName: string }[],
        sliders: readonly { x: number; width: number }[] | number,
    ): readonly AnswerBarAdded[] {
        const sliderDefinitions = this.toSliderDefinitions(sliders);
        const previous = this.assignmentsByRoomId.get(roomId)?.getAll() ?? [];
        const previousSlotByUserId = new Map(previous.map((assignment) => [assignment.ownerUserId, assignment.slot]));
        const roomAssignments = new RoomAssignments();
        this.assignmentsByRoomId.set(roomId, roomAssignments);
        const knownElementIds = this.getOrCreateKnownElementIds(roomId);
        users.forEach((user, index) => {
            const assignment: AnswerBarAssignment = {
                answerBarId: randomUUID(),
                ownerUserId: user.userId,
                ownerUserName: user.userName,
                slot: previousSlotByUserId.get(user.userId) ?? index,
                lineIds: Array.from({ length: sliderDefinitions.length }, () => randomUUID()),
                labelIds: Array.from({ length: sliderDefinitions.length }, () => randomUUID()),
                positionsByLineId: {},
                disconnectedAt: null,
                disconnectedToken: null,
            };
            roomAssignments.set(assignment);
            assignment.positionsByLineId = this.createInitialPositions(
                sliderDefinitions,
                assignment.slot,
                assignment.lineIds,
            );
            assignment.lineIds.forEach((id) => knownElementIds.add(id));
            assignment.labelIds.forEach((id) => knownElementIds.add(id));
        });
        return this.getAll(roomId);
    }

    /**
     * ユーザーの割当を取得し、存在しなければ新規作成する。
     *
     * @param roomId 割当先のルーム ID。
     * @param ownerUserId AnswerBar の所有者 ID。
     * @param ownerUserName AnswerBar のそばに表示する所有者名。
     * @param sliders 割り当てる Slider の X 座標と幅、または互換用の Slider 件数。
     * @returns 割当と、新規に作成したかどうか。
     */
    public getOrCreate(
        roomId: RoomId,
        ownerUserId: OwnerUserId,
        ownerUserName: string,
        sliders: readonly { x: number; width: number }[] | number,
    ): { assignment: AnswerBarAdded; isNew: boolean } {
        const sliderDefinitions = this.toSliderDefinitions(sliders);
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
            lineIds: Array.from({ length: sliderDefinitions.length }, () => randomUUID()),
            labelIds: Array.from({ length: sliderDefinitions.length }, () => randomUUID()),
            positionsByLineId: {},
            disconnectedAt: null,
            disconnectedToken: null,
        };
        assignment.positionsByLineId = this.createInitialPositions(
            sliderDefinitions,
            assignment.slot,
            assignment.lineIds,
        );
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
     * 指定ユーザーの直近の切断時刻を取得する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 対象ユーザー ID。
     * @returns 切断保留中の時刻。割当または保留がない場合は `null`。
     */
    public getDisconnectedAt(roomId: RoomId, userId: OwnerUserId): number | null {
        return this.assignmentsByRoomId.get(roomId)?.getByOwnerUserId(userId)?.disconnectedAt ?? null;
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
     * 指定ユーザーの AnswerBar に表示する所有者名を更新する。
     *
     * @param roomId 対象ルーム ID。
     * @param userId 更新対象のユーザー ID。
     * @param ownerUserName 更新後の所有者名。
     * @returns 更新通知用の情報。割当がない場合は `null`。
     */
    public updateOwnerUserName(
        roomId: RoomId,
        userId: OwnerUserId,
        ownerUserName: string,
    ): AnswerBarOwnerNameUpdated | null {
        const assignment = this.assignmentsByRoomId.get(roomId)?.getByOwnerUserId(userId);
        if (!assignment) {
            return null;
        }

        assignment.ownerUserName = ownerUserName;
        return {
            answerBarId: assignment.answerBarId,
            ownerUserName: assignment.ownerUserName,
            labelIds: assignment.labelIds,
        };
    }

    /**
     * 所有者の AnswerBar 位置を Slider 範囲内へ正規化して保存する。
     *
     * @param roomId 対象ルーム ID。
     * @param ownerUserId 要求元ユーザー ID。
     * @param answerBarId 更新対象 AnswerBar ID。
     * @param lineId 更新対象 line ID。
     * @param x 要求された X 座標。
     * @param slider 更新対象 Slider の座標範囲。
     * @returns 受理・正規化済み位置。所有者、AnswerBar ID、line ID、座標、または Slider の
     * 検証に失敗した場合は `null`。
     */
    public updatePosition(
        roomId: RoomId,
        ownerUserId: OwnerUserId,
        answerBarId: string,
        lineId: string,
        x: unknown,
        slider: { x: number; width: number } | undefined,
    ): number | null {
        const assignment = this.assignmentsByRoomId.get(roomId)?.getByOwnerUserId(ownerUserId);
        if (!assignment || assignment.answerBarId !== answerBarId || !assignment.lineIds.includes(lineId) || !slider) {
            return null;
        }
        if (
            typeof x !== "number" ||
            !Number.isFinite(x) ||
            !Number.isFinite(slider.x) ||
            !Number.isFinite(slider.width) ||
            slider.width < 0
        ) {
            return null;
        }
        const normalizedX = Math.min(Math.max(x, slider.x), slider.x + slider.width);
        assignment.positionsByLineId[lineId] = normalizedX;
        return normalizedX;
    }

    /**
     * AnswerBar として既知の要素を、通常の scene 同期から除外する。
     *
     * 現在・過去の AnswerBar は専用イベントで同期するため、遅延した `SYNC_ELEMENTS` が
     * AnswerBar または名前ラベルを初期位置へ戻したり、退出済み要素を再生成したりしないようにする。
     *
     * @param roomId 対象ルーム ID。
     * @param elements 同期対象の要素。
     */
    public excludeAnswerBarElements<T extends { id: string }>(roomId: RoomId, elements: readonly T[]): readonly T[] {
        const knownElementIds = this.knownElementIdsByRoomId.get(roomId);
        if (!knownElementIds) {
            return elements;
        }

        return elements.filter((element) => !knownElementIds.has(element.id));
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
     * slot と Slider 定義から、line ID ごとの初期 X 座標を作成する。
     *
     * @param sliders AnswerBar を配置する Slider の X 座標と幅。
     * @param slot 初期位置比率を決める論理 slot。
     * @param lineIds Slider 定義順に対応する AnswerBar line ID。
     * @returns line ID をキーとする初期 X 座標。
     */
    private createInitialPositions(
        sliders: readonly { x: number; width: number }[],
        slot: AnswerBarSlot,
        lineIds: readonly string[],
    ): Record<string, number> {
        return Object.fromEntries(
            lineIds.flatMap((lineId, index) => {
                const slider = sliders[index];
                return slider ? [[lineId, slider.x + slider.width * getAnswerBarSlotRatio(slot)]] : [];
            }),
        );
    }

    /**
     * Slider 件数だけが渡された互換呼び出しを、初期位置 0 の Slider 定義へ正規化する。
     *
     * @param sliders Slider 定義、またはその件数。
     * @returns 初期位置計算に使用する Slider 定義。
     */
    private toSliderDefinitions(
        sliders: readonly { x: number; width: number }[] | number,
    ): readonly { x: number; width: number }[] {
        return typeof sliders === "number" ? Array.from({ length: sliders }, () => ({ x: 0, width: 0 })) : sliders;
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
