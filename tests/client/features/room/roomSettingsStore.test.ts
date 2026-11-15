import { roomSettingsStore } from "../../../../src/client/features/room/roomSettingsStore";

describe("roomSettingsStore", () => {
    test("カーソルと AnswerBar の公開状態を個別に更新し、購読者へ通知すること", () => {
        const listener = jest.fn();
        const unsubscribe = roomSettingsStore.subscribe(listener);

        roomSettingsStore.setCursorRevealed(false);
        roomSettingsStore.setAnswerBarReveal(false);

        expect(roomSettingsStore.getSnapshot()).toEqual({ cursorRevealed: false, answerBarReveal: false });
        expect(listener).toHaveBeenCalledTimes(2);
        unsubscribe();
    });
});
