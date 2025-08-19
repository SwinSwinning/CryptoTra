const { createRsiCalculator, createEmaCalculator } = require('./tahelpers'); // move to sync
const { sendTelegramMessage } = require('./telegram');




const PreprocessPairResponseData = (response) => {

  try {

    //console.log(response.data.data.result[response.ticker])
    const ohlcvdata = Object.values(response.data.data.result)[0]
    // console.log(ohlcvdata.slice(ohlcvdata.length-5,ohlcvdata.length)) // Log the last 5 elements of the ohlcvdata array

    const numCandlesForCalc = 700 // Need at least 289 candles to calculate all the indicators
    const arrtoassign = ohlcvdata.slice(ohlcvdata.length - numCandlesForCalc, ohlcvdata.length); // need at least 289 for all the indicators to be calculated

    // assign close, low, volume and timestamp
    const candleArray = []
    for (const data of arrtoassign) {
      candleArray.push(Assign(data))
    }

    const candleTa = []
    // Calculate ta's for most recent 289 candles
    let prevcandle = null;
    const indicators = ["ema21", "ema50", "ema200", "rsi14"];
    const calcIndicators = createCalculateIndicators(indicators);
    const avgVol = createAvgVolumeCalculator(100);
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

      const latestCandle = EnrichCurrentCandle(candleTa.slice(0, candleTa.length - i));
      const prevCandle = candleTa[candleTa.length - 2 - i];

      //  console.log(`Trigger for candle at ${enrichedCandle.timestamp}: ---------------------------- >>>`, enrichedCandle.trigger);
      // console.log("avg volume ", enrichedCandle.last100volavg, " this volume ", enrichedCandle.volume)
      //  console.log("close ", enrichedCandle.close, " ema200 ", enrichedCandle.ema200)
      //  console.log("ema50 ", enrichedCandle.ema50, " > ema200 ", enrichedCandle.ema200)
      //  console.log("rsi14 ", enrichedCandle.rsi14, "  prev rsi ", prevcandle.timestamp, prevcandle.rsi14)

      // 3 Check triggers for latest candle of each pair
      //const trigger = CheckTrigger(latestCandle, prevCandle);
      // console.log(trigger)
      // Add the trigger to the result  
      //latestCandle.trigger = trigger;
      const triggerResult = CheckTrigger(latestCandle, prevCandle);
      latestCandle.trigger = triggerResult.uptrend.triggered || triggerResult.downtrend.triggered; // Add a triggered property to the latest candle
      enrichedArray.push(latestCandle)
      // if (trigger.triggered) {
      //   sendNotification(latestCandle, response.ticker);
      // }
      if (i === 0) {
        latestTriggerResult = triggerResult
      }
    }

  
    return {
      ticker: response.ticker, data: enrichedArray, triggerobj: latestTriggerResult
    }
  } catch (error) {
    console.error('Failed to process data:', error);
    throw new Error("Failed to process data: " + error.message);
  }
}

function Assign(candle) {
  const [timestamp, , , low, close, , volume] = candle; // assign the candle data to the variables timestamp, low, close, and volume 
  const result = {
    timestamp,
    low,
    close,
    volume
  }

  return result
}

function EnrichCurrentCandle(arr) { // sliced array from oldest to newest 20 candles
  const currentCandle = arr[arr.length - 1];
  //console.log("Enriching current candle", currentCandle.timestamp)

  const periods = [1, 77, 144, 288];

  periods.forEach((p) => {

    if (arr.length > p) { // 4 loops
      const prev = arr[arr.length - 1 - p];
      //console.log(`${p}----- Comparing ${currentCandle.timestamp} and ${prev.timestamp}`)
      //console.log(`${p}----- Comparing ${currentCandle.close} and ${prev.close}`)

      currentCandle[`last${p}change`] = ((currentCandle.close - prev.close) / prev.close) * 100;
      //console.log(`last ${p} change: ${currentCandle[`last${p}change`]}`);
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
  
  const aboveAvgVolume = candle.volume > candle.last100volavg*0.7; // Check if the current volume is above 70% of the average volume
  if (!prevCandle) {
    //console.log("No previous candle found, cannot check trigger");
    return { triggered: false, conds: {} };
      }
 

        // ===== Uptrend Signals =====
  const uptrend = {
    aboveAvgVolume,
    closeAboveEMA200: candle.close > candle.ema200,
    ema50Above200: candle.ema50 > candle.ema200,
    rsi50to70Up: candle.rsi14 >= 50 && candle.rsi14 <= 70 &&
                 (!prevCandle || candle.rsi14 > prevCandle.rsi14),
    ema21Bounce: candle.low <= candle.ema21 && candle.close > candle.ema21
  };

        // ===== Downtrend Signals =====
  const downtrend = {
    aboveAvgVolume,
    closeBelowEMA200: candle.close < candle.ema200,
    ema50Below200: candle.ema50 < candle.ema200,
    rsi30to50Down: candle.rsi14 <= 50 && candle.rsi14 >= 30 &&
                   (!prevCandle || candle.rsi14 < prevCandle.rsi14),
    ema21Reject: candle.high >= candle.ema21 && candle.close < candle.ema21
  };

  // Helper to format results
  const formatResults = (name, signals) => {
    const otherConditions = Object.entries(signals)
      .filter(([key]) => key !== "aboveAvgVolume")
      .map(([key, value]) => ({ condition: key, passed: value }));

    const passedCount = otherConditions.filter(c => c.passed).length;
    
    const triggered = signals.aboveAvgVolume &&  ( passedCount >= minConditions);
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



module.exports = {
  PreprocessPairResponseData, CheckTrigger, sendNotification
};