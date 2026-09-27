import os from "os";

/**
 * この端末で利用可能な外部向けIPv4アドレスを取得する。
 *
 * 外部向けアドレスが見つからない場合は、ローカルホスト名を返す。
 *
 * @returns 外部向けIPv4アドレス、または `localhost`
 */
export function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];

        if (!iface) continue;

        for (const net of iface) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }

    return "localhost";
}
