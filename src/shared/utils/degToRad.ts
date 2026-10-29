/**
 * 角度を度数法からラジアンへ変換する。
 *
 * @param deg 度数法で表した角度
 * @returns ラジアンで表した角度
 */
export function degToRad(deg: number): number {
    return (deg / 180) * Math.PI;
}
