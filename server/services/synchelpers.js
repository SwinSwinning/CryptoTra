const { createRsiCalculator, createEmaCalculator } = require('./tahelpers'); // move to sync

let volumeSum = 0;
let volumeQueue = []; // stores last 100 volumes

function updateAvgVolume(newVolume) {
  newVolume = Number(newVolume);
  if (isNaN(newVolume)) return 0;

  volumeQueue.push(newVolume); // now a number
  volumeSum += newVolume;

  if (volumeQueue.length > 100) {
    const removed = volumeQueue.shift();
    volumeSum -= removed;
  }

  return volumeSum / volumeQueue.length;
}


const PreprocessPairResponseData = (response) => {

  try {

    //console.log(response.data.data.result[response.ticker])
    const ohlcvdata = response.data.data.result[response.ticker];
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
    console.log(response.ticker)
    for (const candle of candleArray) {      
      const result = {...candle, ...calcIndicators(candle)};    
      result.last100volavg = avgVol(result.volume);
      //console.log(`${candle.timestamp} Volume: ${candle.volume}, Avg Volume: ${result.last100volavg}`); // Log the volume and average volume 
    candleTa.push(result);
    prevcandle = result; // Update prevcandle for the next iteration
    }



    const enrichedArray = []
    for (let i = 0; i < 20; i++) { // enrich and add to database only the last 20 candles

       const latestCandle = EnrichCurrentCandle(candleTa.slice(0, candleTa.length - i)) ;
       const prevCandle = candleTa[candleTa.length - 2 - i];
     
        //  console.log(`Trigger for candle at ${enrichedCandle.timestamp}: ---------------------------- >>>`, enrichedCandle.trigger);
        // console.log("avg volume ", enrichedCandle.last100volavg, " this volume ", enrichedCandle.volume)
        //  console.log("close ", enrichedCandle.close, " ema200 ", enrichedCandle.ema200)
        //  console.log("ema50 ", enrichedCandle.ema50, " > ema200 ", enrichedCandle.ema200)
        //  console.log("rsi14 ", enrichedCandle.rsi14, "  prev rsi ", prevcandle.timestamp, prevcandle.rsi14)
     
    // 3 Check triggers for latest candle of each pair
      const trigger = CheckTrigger(latestCandle, prevCandle);
      console.log(trigger) 
      // Add the trigger to the result  
      latestCandle.trigger = trigger.triggered;
      enrichedArray.push(latestCandle) 

    }

    return {
      ticker: response.ticker, data: enrichedArray
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

function createCalculateIndicators(indicators) {    // Start here <------------------------------------
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


function CheckTrigger(candle, prevcandle) {

  if (!prevcandle) {
    //console.log("No previous candle found, cannot check trigger");
    return { triggered: false, conds: {} };
  }

  const AbvAvgVolume = candle.volume > candle.last100volavg;

  // Current close above EMA200
  const Aema200 = candle.close > candle.ema200;

  // EMA50 above EMA200
  const EMA50A200 = candle.ema50 > candle.ema200;

  // RSI between 55 and 70 and increasing
  const rsiB5070 = candle.rsi14 >= 50 && candle.rsi14 <= 70 //&& candle.rsi14 > prevcandle.rsi14;


  // Current low below EMA21 and close above EMA21
  const ema21bounce = candle.low <= candle.ema21 && candle.close > candle.ema21;

  const trigger = Aema200 && EMA50A200 && rsiB5070 && AbvAvgVolume// && ema21bounce;
  return {
    "triggered": trigger, "conds": {
      "Aema200": Aema200,
      "EMA50A200": EMA50A200, "rsiB5570": rsiB5070, "AbvAvgVolume": AbvAvgVolume, "ema21bounce": ema21bounce
    }
  };
}

module.exports = {
  PreprocessPairResponseData, CheckTrigger
};