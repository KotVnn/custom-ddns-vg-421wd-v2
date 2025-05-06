const axios = require('axios');
const data = require('./config.json');
let ip = null;

const setIP = (newIp) => {
    ip = newIp;
}

const updateIp = async () => {
    if (!data || typeof data !== 'object' || !data.length) return;
    for (const el of data) {
        const id = await getZone(el);
        if (id) await getDnsZone(el.token, id, el);
    }
}

const updateDns = (token, zoneId, id, domain, type, proxied) => {
    const data = JSON.stringify({
        content: ip,
        name: domain,
        type,
        proxied
    });

    const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        data : data
    };
    //
    const rs = req(config);
    if (rs) console.log(`Update ${domain} to ${ip} successfully.`);
    else console.error(domain, 'Update fail !');
}

const getDnsZone = async (token, id, el) => {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.cloudflare.com/client/v4/zones/${id}/dns_records`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
    };
    const rs = await req(config);
    if (rs && rs.result && rs.result.length) {
        for (const item of el.record) {
            const exists = rs.result.find(element => element.name === item.name);
            if (exists) await updateDns(token, id, exists.id, item.name, item.type, item.proxied);
        }
    }
}

const getZone = el => {
    return new Promise(async resolve => {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://api.cloudflare.com/client/v4/zones',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${el.token}`,
            }
        };

        const rs = await req(config);
        if (rs && rs.result && rs.result.length) {
            for (const item of rs.result) {
                if (item.name === el.domain) return resolve(item.id);
            }
            return resolve(null);
        }
        return resolve(null);
    })
}

const req = config => {
    return new Promise(resolve => {
        axios.request(config)
            .then((response) => {
                return resolve(response.data);
            })
            .catch((error) => {
                console.log('url', config.url, error.message);
                return resolve(req(config));
            });
    })
}

module.exports = { updateIp, setIP };