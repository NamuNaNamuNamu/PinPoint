/**
 * questionTemplates.yaml を TypeScript モジュールへ変換する実行スクリプト。
 *
 * package.json の各ソース参照スクリプトは、生成済みモジュールを最新化するため、
 * TypeScript を出力せず直接実行する `node --import tsx` でこのスクリプトを先行実行する。
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

type UnknownRecord = Record<string, unknown>;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(scriptDirectory, "../src/shared/question/questionTemplates.yaml");
const outputPath = path.resolve(scriptDirectory, "../src/shared/question/QuestionTemplates.generated.ts");
const DEFAULT_SLIDER_X = 100;
const DEFAULT_SLIDER_Y = 250;
const DEFAULT_SLIDER_Y_GAP = 300;
const DEFAULT_SLIDER_WIDTH = 600;
const DEFAULT_SLIDER_HEIGHT = 200;

/**
 * 値が配列ではないオブジェクトかを判定する。
 *
 * @param value 判定する値。
 * @returns 配列ではない非 null オブジェクトの場合は `true`。
 */
function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 値を空白以外の文字を含む文字列として取得する。
 *
 * @param value 検証する値。
 * @param pathName エラーに表示する YAML 上のパス。
 * @returns 検証済みの文字列。
 * @throws 値が文字列でない、または空白文字列だけの場合。
 */
function requiredString(value: unknown, pathName: string): string {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${pathName} は空でない文字列で指定してください。`);
    }
    return value;
}

/**
 * 値を有限数として取得する。
 *
 * @param value 検証する値。
 * @param pathName エラーに表示する YAML 上のパス。
 * @returns 検証済みの有限数。
 * @throws 値が有限数でない場合。
 */
function requiredNumber(value: unknown, pathName: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${pathName} は有限数で指定してください。`);
    }
    return value;
}

/**
 * 未指定時は既定値を使い、指定時は有限数として取得する。
 *
 * @param value 検証する値。
 * @param defaultValue 値が `undefined` の場合に使用する既定値。
 * @param pathName エラーに表示する YAML 上のパス。
 * @returns 既定値または検証済みの有限数。
 * @throws 指定された値が有限数でない場合。
 */
function optionalNumber(value: unknown, defaultValue: number, pathName: string): number {
    return value === undefined ? defaultValue : requiredNumber(value, pathName);
}

/**
 * 未指定時は既定値を使い、指定時は空白以外の文字を含む文字列として取得する。
 *
 * @param value 検証する値。
 * @param defaultValue 値が `undefined` の場合に使用する既定値。
 * @param pathName エラーに表示する YAML 上のパス。
 * @returns 既定値または検証済みの文字列。
 * @throws 指定された値が文字列でない、または空白文字列だけの場合。
 */
function optionalString(value: unknown, defaultValue: string, pathName: string): string {
    return value === undefined ? defaultValue : requiredString(value, pathName);
}

/**
 * YAML の問題テンプレートを検証し、型付き TypeScript モジュールとして出力する。
 *
 * @throws YAML の構造・必須値・数値範囲が不正な場合、またはファイルの読み書きに失敗した場合。
 */
async function generate(): Promise<void> {
    const raw = parse(await readFile(sourcePath, "utf8"));
    if (!isRecord(raw) || !Array.isArray(raw.questions)) {
        throw new Error("questionTemplates.yaml の questions は配列で指定してください。");
    }

    const questions = raw.questions.map((rawQuestion, questionIndex) => {
        if (!isRecord(rawQuestion)) {
            throw new Error(`questions[${questionIndex}] はオブジェクトで指定してください。`);
        }
        const id = requiredNumber(rawQuestion.id, `questions[${questionIndex}].id`);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(`questions[${questionIndex}].id は正の整数で指定してください。`);
        }
        if (!Array.isArray(rawQuestion.sliders)) {
            throw new Error(`questions[${questionIndex}].sliders は配列で指定してください。`);
        }
        return {
            id,
            question: requiredString(rawQuestion.question, `questions[${questionIndex}].question`),
            choiceLeft: requiredString(rawQuestion.choiceLeft, `questions[${questionIndex}].choiceLeft`),
            choiceRight: requiredString(rawQuestion.choiceRight, `questions[${questionIndex}].choiceRight`),
            sliders: rawQuestion.sliders.map((rawSlider, sliderIndex) => {
                if (!isRecord(rawSlider)) {
                    throw new Error(
                        `questions[${questionIndex}].sliders[${sliderIndex}] はオブジェクトで指定してください。`,
                    );
                }
                const correctAnswerRatio = requiredNumber(
                    rawSlider.correctAnswerRatio,
                    `questions[${questionIndex}].sliders[${sliderIndex}].correctAnswerRatio`,
                );
                if (correctAnswerRatio < 0 || correctAnswerRatio > 1) {
                    throw new Error(
                        `questions[${questionIndex}].sliders[${sliderIndex}].correctAnswerRatio は 0 から 1 の範囲で指定してください。`,
                    );
                }
                return {
                    id: optionalString(
                        rawSlider.id,
                        `question-${id}-slider-${sliderIndex + 1}`,
                        `questions[${questionIndex}].sliders[${sliderIndex}].id`,
                    ),
                    name: requiredString(rawSlider.name, `questions[${questionIndex}].sliders[${sliderIndex}].name`),
                    x: optionalNumber(
                        rawSlider.x,
                        DEFAULT_SLIDER_X,
                        `questions[${questionIndex}].sliders[${sliderIndex}].x`,
                    ),
                    y: optionalNumber(
                        rawSlider.y,
                        DEFAULT_SLIDER_Y + DEFAULT_SLIDER_Y_GAP * sliderIndex,
                        `questions[${questionIndex}].sliders[${sliderIndex}].y`,
                    ),
                    width: optionalNumber(
                        rawSlider.width,
                        DEFAULT_SLIDER_WIDTH,
                        `questions[${questionIndex}].sliders[${sliderIndex}].width`,
                    ),
                    height: optionalNumber(
                        rawSlider.height,
                        DEFAULT_SLIDER_HEIGHT,
                        `questions[${questionIndex}].sliders[${sliderIndex}].height`,
                    ),
                    correctAnswerRatio,
                };
            }),
        };
    });

    const source = [
        'import type { QuestionTemplate } from "./QuestionTemplateTypes";',
        "",
        "/** YAML から自動生成された問題テンプレート。手動で編集しないこと。 */",
        `export const questionTemplates = ${JSON.stringify(questions, null, 4)} satisfies readonly QuestionTemplate[];`,
        "",
    ].join("\n");
    await writeFile(outputPath, source, "utf8");
}

generate().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
