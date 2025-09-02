const { createRsiCalculator, createEmaCalculator } = require('./tahelpers');
const { sendTelegramMessage } = require('./telegram');

// const { file1 } = require('./cmc.json')
// const { file2 } = require('./kraken.json')



const PreprocessPairResponseData = (response) => {
  // Specify the CandleData to use for calculation of indicators
  try {
    const ohlcvdata = Object.values(response.data.data.result)[0]
    const numCandlesForCalc = 700 // Specify the number of candles to use for calculating the indicators
    const arrtoassign = ohlcvdata.slice(ohlcvdata.length - numCandlesForCalc, ohlcvdata.length);

    // Assign key value pair for timestamp, low, close, volume
    const candleArray = []
    for (const data of arrtoassign) {
      candleArray.push(Assign(data))
    }

    // Specify indicators to calculate
    const candleTa = []
    let prevcandle = null;
    const indicators = ["ema21", "ema50", "ema200", "rsi14"];
    const calcIndicators = createCalculateIndicators(indicators);
    const avgVol = createAvgVolumeCalculator(100);   // calculate average volume over the past 100 candles
    for (const candle of candleArray) {
      const result = { ...candle, ...calcIndicators(candle) };
      result.last100volavg = avgVol(result.volume);
      //console.log(`${candle.timestamp} Volume: ${candle.volume}, Avg Volume: ${result.last100volavg}`); // Log the volume and average volume 
      candleTa.push(result);
      prevcandle = result; // Update prevcandle for the next iteration
    }



    const enrichedArray = []
    let latestTriggerResult = {}
    const numOfCandles = 20
    for (let i = 0; i < numOfCandles; i++) { // enrich and add to database only the last 20 candles

      const latestCandle = EnrichCurrentCandle(candleTa.slice(0, candleTa.length - i)); // enrich (add last change percentages ) the candles
      const prevCandle = candleTa[candleTa.length - 2 - i];

      const triggerResult = CheckTrigger(latestCandle, prevCandle);
      latestCandle.trigger = triggerResult.uptrend.triggered || triggerResult.downtrend.triggered; // Add a triggered property to the latest candle
      enrichedArray.push(latestCandle)

      if (i === 0) {    // Set the latesttriggerresult for hte most recent candle to prevent multiple notifications from being sent out.
        latestTriggerResult = triggerResult
      }
    }


    return {
      ticker: response.ticker, data: enrichedArray, triggerobj: latestTriggerResult
    }
  } catch (error) {
    console.error('Failed to process data:', error);
    throw new Error("Failed to pre-process data: " + error.message);
  }
}

function Assign(candle) {
  const [timestamp, , , , close, , volume] = candle; // assign the candle data to the variables timestamp, close, and volume 
  const result = {
    timestamp,
    close,
    volume
  }

  return result
}

// function Assign(candle) {
//   const [timestamp, , , low, close, , volume] = candle; // assign the candle data to the variables timestamp, low, close, and volume 
//   const result = {
//     timestamp,
//     low,
//     close,
//     volume
//   }

//   return result
// }

function EnrichCurrentCandle(arr) {
  const currentCandle = arr[arr.length - 1];
  const periods = [1, 77, 144, 288];
  periods.forEach((p) => {

    if (arr.length > p) { // Check if the candleArray is bigger than the lookback period
      const prev = arr[arr.length - 1 - p]; // Specify the candle to compare with the currentcandle
      currentCandle[`last${p}change`] = ((currentCandle.close - prev.close) / prev.close) * 100; // Calculate the percentage change between the two

    } else {
      currentCandle[`last${p}change`] = 0;
    }
  });
  return currentCandle;
};

function createCalculateIndicators(indicators) {
  const indicatorFuncs = {};

  for (const name of indicators) {
    const match = name.match(/^([a-zA-Z]+)(\d+)$/);
    if (!match) continue;

    const type = match[1].toLowerCase();
    const period = Number(match[2]);

    if (type === "ema") indicatorFuncs[name] = createEmaCalculator(period);
    if (type === "rsi") indicatorFuncs[name] = createRsiCalculator(period);
  }

  return function calculateForCandle(candle) {
    const close = Number(candle.close);
    const results = {};

    for (const name in indicatorFuncs) {
      results[name] = indicatorFuncs[name](close);
    }
    return results;
  };
}

function createAvgVolumeCalculator(length = 100) {
  let volumeSum = 0;
  let volumeQueue = [];

  return function update(newVolume) {
    newVolume = Number(newVolume);
    if (isNaN(newVolume)) return 0;

    volumeQueue.push(newVolume);
    volumeSum += newVolume;

    if (volumeQueue.length > length) {
      const removed = volumeQueue.shift();
      volumeSum -= removed;
    }

    return volumeSum / volumeQueue.length;
  };
}


function CheckTrigger(candle, prevCandle, minConditions = 2) {

  const aboveAvgVolume = candle.volume > candle.last100volavg * 0.7; // Check if the current volume is above 70% of the average volume
  if (!prevCandle) {
    return { triggered: false, conds: {} };
  }


  // ===== Uptrend Signals =====
  const uptrend = {
    aboveAvgVolume,
    closeAboveEMA200: candle.close > candle.ema200,
    ema50Above200: candle.ema50 > candle.ema200,
    rsi50to70Up: candle.rsi14 >= 50 && candle.rsi14 <= 70 &&
      (!prevCandle || candle.rsi14 > prevCandle.rsi14)
  };

  // ===== Downtrend Signals =====
  const downtrend = {
    aboveAvgVolume,
    closeBelowEMA200: candle.close < candle.ema200,
    ema50Below200: candle.ema50 < candle.ema200,
    rsi30to50Down: candle.rsi14 <= 50 && candle.rsi14 >= 30 &&
      (!prevCandle || candle.rsi14 < prevCandle.rsi14)
  };

  // Helper to format results
  const formatResults = (name, signals) => {
    const otherConditions = Object.entries(signals)
      .filter(([key]) => key !== "aboveAvgVolume")
      .map(([key, value]) => ({ condition: key, passed: value }));

    const passedCount = otherConditions.filter(c => c.passed).length;

    const triggered = signals.aboveAvgVolume && (passedCount >= minConditions);
    return {
      name,
      triggered,
      conditions: [
        { condition: "aboveAvgVolume", passed: signals.aboveAvgVolume },
        ...otherConditions
      ]
    };
  };

  return {
    uptrend: formatResults("Uptrend", uptrend),
    downtrend: formatResults("Downtrend", downtrend)
  };

}

function sendNotification(candle, ticker, conditions) {

  const pctEmoji = (v) => {
    const num = Number(v);
    return num >= 0
      ? `📈 ${num.toFixed(2)}%`
      : `📉 ${num.toFixed(2)}%`;
  };

  const conditionsText = conditions
    .map(c => `${c.condition}: ${c.passed ? "✅" : "❌"}`)
    .join("\n");

  const message = `Coin: ${ticker}\n` +
    `Current Price: ${Number(candle.close).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
    `Last Change --------: ${pctEmoji(candle.last1change)}\n` +
    `6h Change ----------: ${pctEmoji(candle.last77change)}\n` +
    `12h Change ---------: ${pctEmoji(candle.last144change)}\n` +
    `24h Change----------: ${pctEmoji(candle.last288change)}\n` +
    `RSI-----------------------: ${candle.rsi14.toFixed(2)}\n` +
    `EMA21----------------: ${Number(candle.ema21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
    `EMA50----------------: ${Number(candle.ema50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
    `EMA200---------------: ${Number(candle.ema200).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
    `\nConditions:\n${conditionsText}`;


  // console.log(message)

  sendTelegramMessage(message);
}


function CompareCMCKRaken() {
  const cmc = require('./cmc.json');
  const kraken = require('./kraken.json');

  const symbolMap = {   // add here any other symbols that differ between CMC and Kraken
    BTC: "XBT",
    DOGE: "XDG",
    FRAX: "FXS",
    AXL: "WAXL",
  };


  const result = [];
  const notfound = []

  // Build lookup from Kraken by altname
  const krakenSymbols = new Set();
  for (const [key, val] of Object.entries(kraken.result)) {
    krakenSymbols.add(key);
    krakenSymbols.add(val.altname);
  }

  // Walk through CMC symbols
  for (const coin of cmc.data) {
    const cmcSym = coin.symbol;
    const mappedSym = symbolMap[cmcSym] || cmcSym;

    if (krakenSymbols.has(mappedSym)) {
      const usd = coin.quote?.USD;

      result.push({
        symbol: cmcSym,
        name: coin.name,
        price: usd?.price ?? null,
        percent_change_1h: usd?.percent_change_1h ?? null,
        percent_change_24h: usd?.percent_change_24h ?? null,
        percent_change_7d: usd?.percent_change_7d ?? null,
        percent_change_30d: usd?.percent_change_30d ?? null
      });
    }
    else {
      notfound.push(coin.symbol)
    }
  }

  return result;
}



module.exports = {
  PreprocessPairResponseData, CompareCMCKRaken, sendNotification
};