import { ScoreCalculator } from "../../../../src/server/features/score/ScoreCalculator";

describe("ScoreCalculator", () => {
    const calculator = new ScoreCalculator();
    const question = {
        id: 1,
        question: "質問",
        choiceLeft: "左",
        choiceRight: "右",
        sliders: [
            { id: "slider-left", name: "左寄り", x: 100, y: 200, width: 600, height: 100, correctAnswerRatio: 0.2 },
            { id: "slider-right", name: "右寄り", x: 100, y: 400, width: 600, height: 100, correctAnswerRatio: 0.8 },
        ],
    };
    const assignment = {
        answerBarId: "bar-1",
        ownerUserId: 1,
        ownerUserName: "Alice",
        lineIds: ["line-left", "line-right"],
        labelIds: ["label-left", "label-right"],
        slot: 0,
    };

    test("正解位置は各 Slider を 100 点として合算する", () => {
        expect(
            calculator.calculate(question, [assignment], new Map([
                ["line-left", 220],
                ["line-right", 580],
            ])),
        ).toEqual([{ userId: 1, userName: "Alice", score: 200 }]);
    });

    test("正解位置から最も遠い端は 0 点で、距離に比例して丸める", () => {
        expect(
            calculator.calculate(question, [assignment], new Map([
                ["line-left", 700],
                ["line-right", 100],
            ])),
        ).toEqual([{ userId: 1, userName: "Alice", score: 0 }]);

        expect(
            calculator.calculate(question, [assignment], new Map([
                ["line-left", 460],
                ["line-right", 340],
            ])),
        ).toEqual([{ userId: 1, userName: "Alice", score: 100 }]);
    });

    test("未記録または範囲外の回答は 0 点未満または 100 点超にならない", () => {
        expect(calculator.calculate(question, [assignment], new Map())).toEqual([
            { userId: 1, userName: "Alice", score: 0 },
        ]);
        expect(
            calculator.calculate(question, [assignment], new Map([
                ["line-left", -10_000],
                ["line-right", Number.NaN],
            ])),
        ).toEqual([{ userId: 1, userName: "Alice", score: 0 }]);
    });
});
