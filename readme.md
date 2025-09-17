# CryptoTraAle – Crypto Tracker & Alerts (Dockerized)

CryptoTraNot is a **crypto tracking and alert application** that Retrieves a list of top gainers and Losers in the past hour. It stores this data in a SQLite/Prisma database, displays these top gainers and losers in the UI and can send Telegram notifications when certain conditions are met.

---

## 🚀 Quick Start

### 1. Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
* [Git](https://git-scm.com/) installed

*No need to install Node.js or npm — Docker handles it.*

---

### 2. Clone the Repository

```bash
git clone https://github.com/SwinSwinning/CryptoTra.git
cd CryptoTra
```

---

### 3. Configure the .env

Create a .env file in /server

```bash
# For test environment
TEST_API_KEY={{your test API KEY}}

# For production environment
PROD_API_KEY={{your prod API KEY}}

# Set the environment (test or prod)
NODE_ENV=prod

TELEGRAM_BOT_TOKEN={{Telegram bot token}}
TELEGRAM_CHAT_ID={{your telegram chat id}}

PORT = "8080"
```

---

### 4. Run in Production

This builds optimized frontend static files (served by Nginx) and backend (Node/Express + Prisma).

```bash
docker compose -f compose.prod.yml up --build
```

* Frontend → [http://localhost](http://localhost)
* Backend API → [http://localhost:3001/api/candles](http://localhost:3001/api/candles)

Stop with:

```bash
docker compose -f compose.prod.yml down
```

---

## 📊 Features

Detailed Explanation:
It retrieves data from Both **Kraken API** (no API key required) and **CoinmarketCap API**'s 
1. Retrieve the tradable tickers from Kraken and CMC API 
2. Crosscheck availability between the Kraken and CMC tickers.
3. Retrieve the 200 top gainers of the past hour from CoinmarketCap
4. Retrieve the 200 top losers of the past hour from CoinmarketCap
5. Saves the Gainers and losers that are available for trade on Kraken.
6. Sends a **Telegram notification** once certain conditions for at least 1 ticker pair are met. 

* Stores data in **SQLite database** via Prisma


---

## ⚙️ Telegram Notifications

CryptoTraNot can send Telegram alerts when indicator thresholds are triggered.

1. Create a Telegram bot via [@BotFather](https://t.me/botfather) and get the **Bot Token**.
2. Get your **Chat ID** using [@userinfobot](https://t.me/userinfobot).
3. Add these environment variables to your `.env` file or docker-compose config:

   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token-here
   TELEGRAM_CHAT_ID=your-chat-id-here
   ```
4. Restart the backend container. Notifications will be sent automatically when conditions are met.

---

## 📸 Screenshots

* Dashboard view (recent candles per ticker)
  ![Dashboard Screenshot](docs/screenshots/dashboard.png)

* Telegram notification example
  ![Telegram Alert Screenshot](docs/screenshots/telegram-alert.png)

*(Place screenshots in `docs/screenshots/` folder and they will display here.)*

---

## 📂 Project Structure

```
cryptotranot/
  frontend/     # React + Vite frontend
  backend/      # Node + Express + Prisma backend
  compose.dev.yml
  compose.prod.yml
  .dockerignore
  docs/screenshots/   # store screenshots here
```

---

## 🛠 Roadmap

* Frontend proxy → `/api` requests are forwarded to backend.
* In dev mode, edits reload automatically.
* In prod mode, frontend is served by **Nginx** on port 80.
* Candle fetching runs on a **5-minute cron job** inside the backend.

---

## 🧑‍💻 Author

* Swin
* [Your GitHub](https://github.com/SwinSwinning)
