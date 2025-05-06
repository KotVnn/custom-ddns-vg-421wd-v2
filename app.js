require('dotenv').config();
const { login } = require('./session');
const { request } = require('./req');
const {updateIp, setIP} = require('./cloudflare');

const ROUTER_IP = process.env.ROUTER_IP;
const USERNAME = process.env.ROUTER_USERNAME;
const PASSWORD = process.env.ROUTER_PASSWORD;

let currentWanIp = null;
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
            return setTimeout(main, checkInterval);
        } else if (newWanIp !== currentWanIp) {
            await notifyIpChange(newWanIp);
        } else {
            console.log(`[OK] IP WAN vẫn giữ nguyên: ${newWanIp}`);
        }

        setTimeout(fetchAndCheckLog, checkInterval);

    } catch (err) {
        console.error('[ERROR] Lỗi khi request log:', err.message);
        setTimeout(main, checkInterval);
    }
};

const getToken = async () => {
    try {
        const htmlToolLog = await request({method: 'get', url: `${ROUTER_IP}/cgi-bin/tools-log.asp`});
        const token = htmlToolLog.data.match(/name=["']TokenString["'][^>]*value=["']([^"']+)["']/i)?.[1];
        if (token) return token;
        else return null;
    } catch (err) {
        console.error('[ERROR] Lỗi khi request log:', err.message);
        return null;
    }
}

const setLog = async token => {
    try {
        await request({method: 'get', url: `${ROUTER_IP}/cgi-bin/syslog_tool.cgi?requesttype=refresh&logtype=0&TokenString=${token}`})
        return true;
    } catch (err) {
        console.error('[ERROR] Lỗi khi set log:', err.message);
        return false;
    }
}

const main = async () => {
    try {
        await login(ROUTER_IP, USERNAME, PASSWORD);
        console.log('[INFO] Đã login thành công');
        const token = await getToken();
        if (token) {
            const rs = await setLog(token);
            if (rs) await fetchAndCheckLog(); // bắt đầu kiểm tra
            else setTimeout(main, checkInterval);
        } else {
            setTimeout(main, checkInterval);
        }
    } catch (err) {
        console.error('[FATAL] Không login được:', err.message);
        setTimeout(main, checkInterval);
    }
};

main().then();
