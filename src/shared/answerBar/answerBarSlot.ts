/**
 * AnswerBar の slot を Slider 上の初期位置比率へ変換する。
 *
 * @param slot 割当済みの論理スロット。
 * @returns Slider の左端を 0、右端を 1 とした初期位置比率。
 */
export function getAnswerBarSlotRatio(slot: number): number {
    const level = Math.floor(Math.log2(slot + 1));
    const firstSlotInLevel = 2 ** level - 1;
    return (2 * (slot - firstSlotInLevel) + 1) / 2 ** (level + 1);
}
