import { AnswerBarAssignmentState } from "../../../../src/server/features/answerBar/AnswerBarAssignmentState";

/** AnswerBarAssignmentState の単体テスト。 */
describe("AnswerBarAssignmentState", () => {
    let state: AnswerBarAssignmentState;

    beforeEach(() => { state = new AnswerBarAssignmentState(); });

    test("新規参加者へ名前、Slider 件数分の一意な line ID と label ID、slot を割り当てること", () => {
        const result = state.getOrCreate("room-1", 1, "ゆう", 2);

        expect(result.isNew).toBe(true);
        expect(result.assignment).toEqual(expect.objectContaining({ ownerUserId: 1, ownerUserName: "ゆう", slot: 0 }));
        expect(result.assignment.lineIds).toHaveLength(2);
        expect(result.assignment.labelIds).toHaveLength(2);
        expect([...new Set(result.assignment.lineIds)]).toHaveLength(2);
        expect([...new Set(result.assignment.labelIds)]).toHaveLength(2);
    });

    test("同じユーザーの再 join では名前と要素 ID を含む既存の割当を返すこと", () => {
        const first = state.getOrCreate("room-1", 1, "ゆう", 2);
        state.markDisconnected("room-1", 1);

        const second = state.getOrCreate("room-1", 1, "変更後の名前", 2);

        expect(second.isNew).toBe(false);
        expect(second.assignment).toEqual(first.assignment);
    });

    test("削除した slot を次の参加者に再利用すること", () => {
        state.getOrCreate("room-1", 1, "一人目", 1);
        const second = state.getOrCreate("room-1", 2, "二人目", 1);
        state.remove("room-1", 1);
        const third = state.getOrCreate("room-1", 3, "三人目", 1);

        expect(second.assignment.slot).toBe(1);
        expect(third.assignment.slot).toBe(0);
    });

    test("切断保留中の同じ世代だけを線と名前ラベルの削除イベントに変換すること", () => {
        const created = state.getOrCreate("room-1", 1, "ゆう", 2);
        const token = state.markDisconnected("room-1", 1);

        expect(state.removeIfStillDisconnected("room-1", 1, token!)).toEqual({
            answerBarId: created.assignment.answerBarId,
            lineIds: created.assignment.lineIds,
            labelIds: created.assignment.labelIds,
        });
    });

    test("削除済みの名前ラベルを古い scene 同期から除外すること", () => {
        const created = state.getOrCreate("room-1", 1, "ゆう", 1);
        state.remove("room-1", 1);

        expect(state.excludeInactiveAnswerBarElements("room-1", [
            { id: "other" }, { id: created.assignment.lineIds[0] }, { id: created.assignment.labelIds[0] },
        ])).toEqual([{ id: "other" }]);
    });
});
