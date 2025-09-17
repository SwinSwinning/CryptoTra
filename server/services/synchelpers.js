const { createRsiCalculator, createEmaCalculator } = require('./tahelpers');
const { sendTelegramMessage } = require('./telegram');



const PreprocessPairResponseData = (response) => {
  // Specify the CandleData to use for calculation of indicators
  try {
    const ohlcvdata = Object.values(response.data.data.result)[0]

    const numCandlesForCalc = 700 // Specify the number of candles to use for calculating the indicators
    const openSlice = Math.max(ohlcvdata.length - numCandlesForCalc, 0)   // take at least 0 as the openslice. This prevents a negative number from being used as the open slice
    const arrtoassign = ohlcvdata.slice(openSlice, ohlcvdata.length);

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
    // let latestTriggerResult = {}
    const numOfCandles = Math.min(candleTa.length, 5) // take 5 or the candleta length if there are less than 20 historical candles
    for (let i = 0; i < numOfCandles; i++) { // enrich and add to database these specified number of candles

      const latestCandle = EnrichCurrentCandle(candleTa.slice(0, candleTa.length - i)); // enrich (add last change percentages ) to the latest candle ( Take sliced candlearray as input)

  
      enrichedArray.push(latestCandle)


    }


    return {
      ticker: response.ticker, data: enrichedArray
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


function EnrichCurrentCandle(arr) {
  const currentCandle = arr[arr.length - 1];
  const periods = [2, 6, 144, 288];
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

function CrossCheckTickers(cmc, kraken) {

  const symbolMap = {   // add here any other symbols that differ between CMC and Kraken
    BTC: "XBT",
    DOGE: "XDG",
    FRAX: "FXS",
    AXL: "WAXL",
    $MICHI: "MICHI",
    $M: "M",


  };


  const result = [];

  // Build lookup from Kraken by altname
  const krakenSymbols = new Set();
  for (const [key, val] of Object.entries(kraken.data.result)) {
    krakenSymbols.add(key);
    krakenSymbols.add(val.altname);
  }

  for (kraksym of krakenSymbols) {

    for (const coin of cmc.data) {
      const cmcSym = coin.symbol;
      const mappedSym = symbolMap[cmcSym] || cmcSym;
      if (kraksym === mappedSym) {
        result.push({
          cmcid: coin.id,
          symbol: cmcSym,
          name: coin.name
        });
        break;
      }
    }
  }
  return [result, symbolMap];
}

function CheckTrigger(coin, minConditions = 2) {

  const candle = coin.ticker.krakenCandle[0]
  const minAvgVol = candle.last100volavg > 2000
  //const aboveAvgVolume = candle.volume > candle.last100volavg * 0.7; // Check if the current volume is above 70% of the average volume

  console.log("----- Coin ", coin.ticker.cmcticker)
  console.log("Last 30 min change ", candle.last6change)
  console.log("avg vol above 2000 ", minAvgVol)
  console.log("close above 200  ", candle.price > candle.ema200)
  console.log("50 above 200 ", candle.ema50 > candle.ema200)
  console.log("RSI ", candle.rsi14)
  console.log("-----------------------------")


  // ===== Protections  =====
  const downcond =
    candle.last6change < -3 &&
    minAvgVol &&
    candle.price < candle.ema200 &&
    candle.ema50 < candle.ema200 &&
    candle.rsi14 > 30

  const upcond =
    candle.last6change > 3 &&
    minAvgVol &&
    candle.price > candle.ema200 &&
    candle.ema50 > candle.ema200 &&
    candle.rsi14 < 70


  return { coin: coin, trigger: upcond || downcond }



}

function sendNotification(coin, string) {  // {coinname, Boolean trigger}

  const pctEmoji = (v) => {
    const num = Number(v);
    return num >= 0
      ? `📈 ${num.toFixed(2)}%`
      : `📉 ${num.toFixed(2)}%`;
  };



  let message = `${string} last period: \n`
  for (const c of coin) {
    const coinname = c.ticker.name.replaceAll(" ", "-")

    message += `<a href="https://coinmarketcap.com/currencies/${coinname}">${c.ticker.name} (${c.ticker.krakenticker})</a> -- ${pctEmoji(c.p1h_change)}\n` +
      `last 2 change ----: ${pctEmoji(c.ticker.krakenCandle[0].last2change)}\n` +
      `30m Change ----------: ${pctEmoji(c.ticker.krakenCandle[0].last6change)}\n` +
      `Last 24h Change ----------: ${pctEmoji(c.p24h_change)}\n` +
      `Volume : Avg----------: ${c.ticker.krakenCandle[0].volume} : ${c.ticker.krakenCandle[0].last100volavg} \n   \n`

  }




  console.log(message)

  sendTelegramMessage(message);
}


function CheckTriggerold(candle, prevCandle, minConditions = 2) {

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

  return

  return {
    uptrend: formatResults("Uptrend", uptrend),
    downtrend: formatResults("Downtrend", downtrend)
  };

}

function sendNotificationold(candle, ticker, conditions) {

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
    `6h Change ----------: ${pctEmoji(candle.last6change)}\n` +
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


module.exports = {
  PreprocessPairResponseData, CrossCheckTickers, sendNotification, CheckTrigger
};