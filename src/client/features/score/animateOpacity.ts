type Params = { duration: number; onUpdate(opacity: number): void };

/**
 * requestAnimationFrame で opacity を 1 から 0 へ補間する。
 *
 * @param params アニメーション時間と各フレームの反映処理。
 * @returns アニメーションを停止する関数。
 */
export function animateOpacity({ duration, onUpdate }: Params): () => void {
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        onUpdate(1 - progress);
        if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
}
