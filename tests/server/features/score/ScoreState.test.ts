import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { ScoreState } from "../../../../src/server/features/score/ScoreState";

describe("ScoreState", () => {
    const question = {
        id: 1,
        question: "質問",
        choiceLeft: "左",
        choiceRight: "右",
        sliders: [{ id: "slider-1", name: "評価", x: 100, y: 200, width: 600, height: 100, correctAnswerRatio: 0.5 }],
    };
    const assignments = [
        {
            answerBarId: "bar-1",
            ownerUserId: 1,
            ownerUserName: "Alice",
            lineIds: ["line-1"],
            labelIds: ["label-1"],
            slot: 0,
        },
        {
            answerBarId: "bar-2",
            ownerUserId: 2,
            ownerUserName: "Bob",
            lineIds: ["line-2"],
            labelIds: ["label-2"],
            slot: 1,
        },
    ];

    test("所有者自身の回答位置だけを受理し、採点結果を累積する", () => {
        const state = new ScoreState();
        state.addParticipant("room-1", 1, "Alice");
        state.addParticipant("room-1", 2, "Bob");
        state.prepareQuestion("room-1", question, assignments);

        state.recordPositions(
            "room-1",
            1,
            [{ id: "line-1", x: 400, isDeleted: false }] as ExcalidrawElement[],
            assignments,
        );
        state.recordPositions(
            "room-1",
            1,
            [{ id: "line-2", x: 400, isDeleted: false }] as ExcalidrawElement[],
            assignments,
        );

        expect(state.addQuestionScores("room-1", question, assignments)).toEqual([
            { userId: 1, userName: "Alice", score: 100 },
            { userId: 2, userName: "Bob", score: 50 },
        ]);
    });

    test("reset は累積得点を 0 に戻し、clear はルーム状態を破棄する", () => {
        const state = new ScoreState();
        state.addParticipant("room-1", 1, "Alice");
        state.addParticipant("room-1", 2, "Bob");
        state.prepareQuestion("room-1", question, assignments);
        state.addQuestionScores("room-1", question, assignments);

        expect(state.reset("room-1")).toEqual([
            { userId: 1, userName: "Alice", score: 0 },
            { userId: 2, userName: "Bob", score: 0 },
        ]);
        state.clear("room-1");
        expect(state.get("room-1")).toEqual([]);
    });

    test("退出者を非表示にし、scoreReset 前の再参加では累積得点を復元する", () => {
        const state = new ScoreState();
        const assignment = assignments[0]!;
        state.addParticipant("room-1", 1, "Alice");
        state.prepareQuestion("room-1", question, [assignment]);
        state.recordPositions("room-1", 1, [{ id: "line-1", x: 400, isDeleted: false }] as ExcalidrawElement[], [
            assignment,
        ]);
        state.addQuestionScores("room-1", question, [assignment]);

        state.removeParticipant("room-1", 1);
        expect(state.get("room-1")).toEqual([]);
        state.addParticipant("room-1", 1, "Alice");
        expect(state.get("room-1")).toEqual([{ userId: 1, userName: "Alice", score: 100 }]);
    });

    test("退出中に scoreReset した参加者は再参加時に 0 点となる", () => {
        const state = new ScoreState();
        const assignment = assignments[0]!;
        state.addParticipant("room-1", 1, "Alice");
        state.prepareQuestion("room-1", question, [assignment]);
        state.recordPositions("room-1", 1, [{ id: "line-1", x: 400, isDeleted: false }] as ExcalidrawElement[], [
            assignment,
        ]);
        state.addQuestionScores("room-1", question, [assignment]);
        state.removeParticipant("room-1", 1);

        expect(state.reset("room-1")).toEqual([]);
        state.addParticipant("room-1", 1, "Alice");
        expect(state.get("room-1")).toEqual([{ userId: 1, userName: "Alice", score: 0 }]);
    });
});
