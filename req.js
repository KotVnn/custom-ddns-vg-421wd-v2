// request.js
const axios = require('axios');
const https = require('https');

let sessionId = null; // lưu session ID toàn cục

function setSession(id) {
    sessionId = id;
}

function getSession() {
    return sessionId;
}

async function request({ method = 'get', url, data = null, headers = {} }) {
    if (!sessionId) throw new Error('SessionID chưa được thiết lập');
    const config = {
        method,
        url,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
            'Referer': url,
            'Cookie': `SESSIONID=${sessionId}`,
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            ...headers,
        },
    };

    if (data) config.data = data;

    return axios(config);
}

module.exports = {
    request,
    setSession,
    getSession
};
