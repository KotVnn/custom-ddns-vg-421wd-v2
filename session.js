const axios = require('axios');
const https = require('https');
const qs = require('qs');
const { setSession, getSession} = require('./req');

async function login(routerIp, username, password) {
    const currentSession = getSession();
    if (currentSession) {
        try {
            await axios.get(`${routerIp}/cgi-bin/logout.cgi`, {
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                timeout: 1000,
                headers: {
                    'Cookie': `SESSIONID=${currentSession}`,
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': `${routerIp}/cgi-bin/home.asp`
                }
            });
        } catch (err) {
            setSession(null);
            await login(routerIp, username, password);
        }
    }

    const loginPage = `${routerIp}/cgi-bin/login.asp`;

    // 1. GET để lấy SESSIONID
    const res = await axios.get(loginPage, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 1000,
    });

    let cookies = res.headers['set-cookie'];
    if (!cookies || !cookies[0]) throw new Error('Không nhận được SESSIONID');

    let sessionId = cookies[0].match(/SESSIONID=([^;]+)/)[1];
    setSession(sessionId);

    // 2. POST login
    const formData = qs.stringify({
        StatusActionFlag: -1,
        Username: username,
        Password: password
    });

    const loginRes = await axios.post(loginPage, formData, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `SESSIONID=${sessionId}`,
            'User-Agent': 'Mozilla/5.0',
            'Referer': loginPage
        }
    });

    cookies = loginRes.headers['set-cookie'];
    if (!cookies || !cookies[0]) throw new Error('Không nhận được SESSIONID');
    sessionId = cookies[0].match(/SESSIONID=([^;]+)/)[1];

    setSession(sessionId);
    return loginRes.data;
}

module.exports = { login };
