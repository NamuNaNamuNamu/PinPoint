/**
 * 数値をイージングしながら更新する。
 *
 * 呼び出し元は返された関数を、React の cleanup または次のアニメーション開始時に
 * 呼び出して古い描画フレームを停止する。
 *
 * @param params 開始値、終了値、時間、更新関数および整数化の指定。
 * @returns 予約済みのアニメーションフレームを停止する関数。
 */
export function animateNumber({ start, end, duration, onUpdate, isInteger = true }: AnimateNumberParams): () => void {
    const startTime = performance.now();
    let animationFrameId: number | undefined;
    let cancelled = false;

    const update = (currentTime: number): void => {
        if (cancelled) {
            return;
        }
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const value = start + (end - start) * easedProgress;
        onUpdate(isInteger ? Math.floor(value) : value);
        if (progress < 1) {
            animationFrameId = requestAnimationFrame(update);
        }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => {
        cancelled = true;
        if (animationFrameId !== undefined) {
            cancelAnimationFrame(animationFrameId);
        }
    };
}

/** 数値アニメーションの入力。 */
export type AnimateNumberParams = {
    start: number;
    end: number;
    duration: number;
    onUpdate: (value: number) => void;
    isInteger?: boolean;
};
