# 🔄 Auto Update DNS Record to Cloudflare

### A small utility to automatically update your WAN (external) IP address to a Cloudflare DNS record.

---

## 🚀 Features

- Reads and monitors the WAN IP directly from a **Viettel VG-421WD-V2 router** using its `messages.log` endpoint
- Automatically updates your Cloudflare DNS record when your WAN IP changes
- Can run as a standalone Node.js app or inside a Docker container
- Environment-based configuration using `.env` and `config.json`

---

## ⚙️ How It Works

1. The app logs into your Viettel VG-421WD-V2 router over HTTPS using the web admin interface
2. Every 3 seconds, it reads the router's `messages.log` and extracts the WAN IP from log lines like:
   [ppp] local IP address 11x.x.x.88
3. If the WAN IP has changed, the app will make a POST request to your Cloudflare API to update your Cloudflare DNS record

---

## 📁 Setup & Configuration

### 1. Create `config.json`

Rename the example config file:

```bash
cp example.config.json config.json
```
Then fill in your Cloudflare information:
```json
{
  "apiToken": "your_cloudflare_api_token",
  "zoneId": "your_zone_id",
  "recordName": "your.domain.com",
  "recordType": "A"
}
```

### 2. Create a .env file with router credentials and settings
ROUTER_IP=https://192.168.1.1
ROUTER_USERNAME=admin
ROUTER_PASSWORD=your_router_password

- ROUTER_IP: Internal IP address of your router
- ROUTER_USERNAME, ROUTER_PASSWORD: Credentials to log in to the router's web UI
- NOTIFY_URL: Internal endpoint that will receive the updated IP and update Cloudflare DNS

# 🐳 Docker (optional)
### ⚠️ The provided Dockerfile is tailored for use on a specific server. You may need to modify it for your own environment.

```bash
docker build -t cloudflare-updater .
docker run -d --env-file .env cloudflare-updater
```

# 📝 Notes
- This tool currently supports the Viettel VG-421WD-V2 router via its built-in web interface
- No root or SSH access to the router is required
- If you are using a different router, you may need to adjust the parseWanIpFromLog() function to support its log format

## 🔁 Example log lines extracted from the router:
```log
May 05 19:07:17 [Notice] syslog: [ppp] remote IP address xxx.xxx.xx.xxx
May 05 19:07:17 [Notice] syslog: [ppp] local  IP address 116.xxx.xx.78
```

# 🤝 Contributing
### Contributions are welcome! Feel free to submit a pull request, bug report, or feature suggestion.