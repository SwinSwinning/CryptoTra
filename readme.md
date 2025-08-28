# CryptoTraAle – Crypto Tracker & Alerts (Dockerized)

CryptoTraNot is a **crypto tracking and alert application** that fetches live candle data at 5-minute intervals for specific ticker symbols. It stores the data in a SQLite/Prisma database, displays recent candle information in a web frontend, and can send Telegram notifications when certain indicator conditions are met.

---

## 🚀 Quick Start

### 1. Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
* [Git](https://git-scm.com/) installed

*No need to install Node.js or npm — Docker handles it.*

---

### 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/cryptotranot.git
cd cryptotranot
```

---

### 3. Run in Development (hot reload)

This runs the React frontend (Vite) and backend (Node/Express + Prisma) with live reload.

```bash
docker compose -f compose.dev.yml up --build
```

* Frontend → [http://localhost:5173](http://localhost:5173)
* Backend API → [http://localhost:3001/api/candles](http://localhost:3001/api/candles)

Stop with:

```bash
docker compose -f compose.dev.yml down
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

* Fetches live **5-minute candle data** from **Kraken API** (no API key required)
* Stores data in **SQLite database** via Prisma
* Displays last **5 candles per ticker** with:

  * Timestamp
  * Ticker
  * Price
  * Volume
  * 6h, 12h, and 24h price change (%)
* Backend can send **Telegram notifications** when configured indicator conditions are met

---

## ⚙️ Telegram Notifications

CryptoTraNot can send Telegram alerts when indicator thresholds are triggered.

1. Create a Telegram bot via [@BotFather](https://t.me/botfather) and get the **Bot Token**.
2. Get your **Chat ID** using [@userinfobot](https://t.me/userinfobot).
3. Add these environment variables in a `.env` file or docker-compose config:

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

## 🛠 Development Notes

* Frontend proxy → `/api` requests are forwarded to backend.
* In dev mode, edits reload automatically.
* In prod mode, frontend is served by **Nginx** on port 80.
* Candle fetching runs on a **5-minute cron job** inside the backend.

---

## 🧑‍💻 Author

* Your Name
* [Your GitHub](https://github.com/YOUR_USERNAME)
