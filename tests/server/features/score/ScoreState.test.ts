import { ScoreState } from "../../../../src/server/features/score/ScoreState";

describe("ScoreState", () => {
    const question = {
        id: 1,
        question: "質問",
        choiceLeft: "左",
        choiceRight: "右",
        sliders: [{ id: "slider-1", name: "評価", x: 100, y: 200, width: 600, height: 100, correctAnswerRatio: 0.5 }],
    };
    const assignment = {
        answerBarId: "bar-1",
        ownerUserId: 1,
        ownerUserName: "Alice",
        lineIds: ["line-1"],
        labelIds: ["label-1"],
        slot: 0,
    };

    test("位置を保持せず、呼び出し側から渡された読み取り専用位置で採点すること", () => {
        const state = new ScoreState();
        state.addParticipant("room-1", 1, "Alice");

        expect(state.addQuestionScores("room-1", question, [assignment], new Map([["line-1", 400]]))).toEqual([
            { userId: 1, userName: "Alice", score: 100 },
        ]);
        expect("prepareQuestion" in state).toBe(false);
        expect("recordPositions" in state).toBe(false);
    });

    test("reset と clear は得点状態だけを操作すること", () => {
        const state = new ScoreState();
        state.addParticipant("room-1", 1, "Alice");
        state.addQuestionScores("room-1", question, [assignment], new Map([["line-1", 400]]));

        expect(state.reset("room-1")).toEqual([{ userId: 1, userName: "Alice", score: 0 }]);
        state.clear("room-1");
        expect(state.get("room-1")).toEqual([]);
    });

    test("公開後の復帰位置で今回問題の得点だけを差し替えること", () => {
        const state = new ScoreState();
        state.addParticipant("room-1", 1, "Alice");
        state.addQuestionScores("room-1", question, [assignment], new Map([["line-1", 100]]));

        expect(state.replaceQuestionScore("room-1", question, assignment, new Map([["line-1", 400]]))).toEqual([
            { userId: 1, userName: "Alice", score: 100 },
        ]);
    });

    test("得点リセット後の復帰採点では server の 0 点を維持すること", () => {
        const state = new ScoreState();
        state.addParticipant("room-1", 1, "Alice");
        state.addQuestionScores("room-1", question, [assignment], new Map([["line-1", 100]]));
        state.reset("room-1");

        expect(state.replaceQuestionScore("room-1", question, assignment, new Map([["line-1", 400]]))).toEqual([
            { userId: 1, userName: "Alice", score: 0 },
        ]);
    });
});
