require('dotenv').config();
const { login } = require('./session');
const { request } = require('./req');
const {updateIp, setIP} = require('./cloudflare');

const ROUTER_IP = process.env.ROUTER_IP;
const USERNAME = process.env.ROUTER_USERNAME;
const PASSWORD = process.env.ROUTER_PASSWORD;

let currentWanIp = null;
let retryTimeout = 30000;
let checkInterval = 3000;

const parseWanIpFromLog = (logText) => {
    const lines = logText.split('\n'); // đọc từ dưới lên để lấy dòng gần nhất
    for (let line of lines) {
        if (line.includes('[ppp] local  IP address')) {
            const match = line.match(/(\d{1,3}\.){3}\d{1,3}/);
            if (match) {
                return match[0];
            }
        }
    }
    return null;
};

const notifyIpChange = async (newIp) => {
    try {
        console.log(`[INFO] WAN IP thay đổi: ${currentWanIp} ➜ ${newIp}`);
        setIP(newIp);
        await updateIp();
        currentWanIp = newIp;
    } catch (err) {
        console.error('[ERROR] Không gửi được thông báo IP:', err.message);
    }
};

const fetchAndCheckLog = async () => {
    try {
        const logRes = await request({
            method: 'get',
            url: `${ROUTER_IP}/messages.log`,
            headers: {
                'Referer': `${ROUTER_IP}/cgi-bin/tools-log.asp`,
            }
        });

        const newWanIp = parseWanIpFromLog(logRes.data);

        if (!newWanIp) {
            console.warn('[WARN] Không tìm thấy IP WAN trong log');
        } else if (newWanIp !== currentWanIp) {
            await notifyIpChange(newWanIp);
        } else {
            console.log(`[OK] IP WAN vẫn giữ nguyên: ${newWanIp}`);
        }

        setTimeout(fetchAndCheckLog, checkInterval);

    } catch (err) {
        console.error('[ERROR] Lỗi khi request log:', err.message);
        setTimeout(fetchAndCheckLog, retryTimeout);
    }
};

const main = async () => {
    try {
        await login(ROUTER_IP, USERNAME, PASSWORD);
        console.log('[INFO] Đã login thành công');
        await fetchAndCheckLog(); // bắt đầu kiểm tra
    } catch (err) {
        console.error('[FATAL] Không login được:', err.message);
    }
};

main().then();
