# 📈 Coin Trend Finder

**Coin Trend Finder** is a cryptocurrency tracking tool designed to identify strong price action by highlighting the top gainers and losers over short timeframes (30 minutes and 1 hour). It helps traders spot volatility and trending assets quickly.

## ✨ Features

* **Real-Time Trend Spotting:** Instantly view the top 3 gainers and losers over the last 30 minutes and 1 hour on a sleek dashboard.
* **Detailed Coin Analysis:** Click on any coin for a dedicated view containing specific indicator information.
* **External Integration:** Quick links to CoinMarketCap for deeper fundamental research.
* **Auto-Refresh:** Data automatically updates at 5-minute intervals to keep you current.
* **Telegram Alerts:** Configurable notifications sent directly to your Telegram when specific market conditions are met.

## 🛠 Tech Stack

* **Frontend:** React
* **Backend:** Node.js
* **Database:** SQLite with Prisma ORM
* **APIs:** CoinMarketCap (Metadata/Global metrics) & Kraken (Real-time price feeds)

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

* **Node.js** (v14 or higher recommended)
* **npm**

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/SwinSwinning/CryptoTra.git](https://github.com/SwinSwinning/CryptoTra.git)
    cd CryptoTra
    ```

2.  **Install Server Dependencies**
    Navigate to the server directory and install the required packages.
    ```bash
    cd server
    npm install
    ```
    *(Optional: If you haven't set up the database yet)*
    ```bash
    npx prisma migrate dev
    ```

3.  **Install Client Dependencies**
    Open a new terminal, navigate to the client directory, and install packages.
    ```bash
    cd ../client
    npm install
    ```

### ⚙️ Configuration

You need to set up your environment variables for the backend to function correctly.

1.  Create a file named `.env` in the root of the **`server/`** folder.
2.  Copy the following format into the file and fill in your values:

```env
# Server Configuration
PORT=8080
NODE_ENV=development  # Set to 'production' for live deployment

# CoinMarketCap API Keys
TEST_API_KEY=your_sandbox_api_key
PROD_API_KEY=your_production_api_key

# Telegram Notifications (Optional)
# Required only if you want to receive alert messages
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 🏃‍♂️ Running the App

You will need to run the client and server in separate terminal windows.

**1. Start the Backend Server**
```bash
cd server
npm start
```
*The server will start on port 8080 (or the port defined in your .env).*

**2. Start the Frontend Client**
```bash
cd client
npm start
```
*The React app should open automatically in your browser (usually at http://localhost:3000).*

## 📱 Usage

1.  Open the web interface.
2.  The dashboard will load the current top gainers and losers.
3.  The app will poll for new data every 5 minutes.
4.  If Telegram keys are configured, you will receive alerts when the defined price action criteria are triggered.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.