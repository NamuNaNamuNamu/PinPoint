import { AnswerBarAssignmentState } from "../../../../src/server/features/answerBar/AnswerBarAssignmentState";

/**
 * AnswerBarAssignmentState の単体テスト。
 */
describe("AnswerBarAssignmentState", () => {
    /**
     * 各テストで独立した割当状態を使用する。
     */
    let state: AnswerBarAssignmentState;

    beforeEach(() => {
        state = new AnswerBarAssignmentState();
    });

    test("新規参加者へ Slider 件数分の一意な line ID と slot を割り当てること", () => {
        const result = state.getOrCreate("room-1", 1, 2);

        expect(result.isNew).toBe(true);
        expect(result.assignment.ownerUserId).toBe(1);
        expect(result.assignment.slot).toBe(0);
        expect(result.assignment.lineIds).toHaveLength(2);
        expect([...new Set(result.assignment.lineIds)]).toHaveLength(2);
    });

    test("同じユーザーの再 join では既存の割当を返すこと", () => {
        const first = state.getOrCreate("room-1", 1, 2);
        state.markDisconnected("room-1", 1);

        const second = state.getOrCreate("room-1", 1, 2);

        expect(second.isNew).toBe(false);
        expect(second.assignment).toEqual(first.assignment);
    });

    test("削除した slot を次の参加者に再利用すること", () => {
        state.getOrCreate("room-1", 1, 1);
        const second = state.getOrCreate("room-1", 2, 1);

        state.remove("room-1", 1);

        const third = state.getOrCreate("room-1", 3, 1);

        expect(second.assignment.slot).toBe(1);
        expect(third.assignment.slot).toBe(0);
    });

    test("再接続後は古い切断猶予トークンで割当を削除しないこと", () => {
        const first = state.getOrCreate("room-1", 1, 1);
        const token = state.markDisconnected("room-1", 1);

        state.getOrCreate("room-1", 1, 1);

        expect(token).not.toBeNull();
        expect(state.removeIfStillDisconnected("room-1", 1, token!)).toBeNull();
        expect(state.getAll("room-1")).toEqual([first.assignment]);
    });

    test("切断保留中の同じ世代だけを削除イベントに変換すること", () => {
        const created = state.getOrCreate("room-1", 1, 2);
        const token = state.markDisconnected("room-1", 1);

        const removed = state.removeIfStillDisconnected("room-1", 1, token!);

        expect(removed).toEqual({
            answerBarId: created.assignment.answerBarId,
            lineIds: created.assignment.lineIds,
        });
        expect(state.getAll("room-1")).toEqual([]);
    });
});
