/**
 * 線要素を移動できる座標の最小値と最大値。
 */
export interface MoveRange {
    /**
     * 移動可能な X 座標の最小値。
     */
    minX: number;
    /**
     * 移動可能な X 座標の最大値。
     */
    maxX: number;
    /**
     * 移動可能な Y 座標の最小値。
     */
    minY: number;
    /**
     * 移動可能な Y 座標の最大値。
     */
    maxY: number;
}
