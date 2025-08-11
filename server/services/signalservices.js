const { createRsiCalculator, createEmaCalculator } = require('./tahelpers'); // move to sync


function calculateAverageVolume(volumes) {
   return volumes.map((_, i) =>
    i < 99 ? null : volumes.slice(i - 99, i + 1).reduce((a, b) => a + b, 0) / 100
  );
}


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



function CheckTrigger(candle,  prevcandle ) {
     
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

  const trigger =  Aema200 && EMA50A200 && rsiB5070 && AbvAvgVolume// && ema21bounce;
  return {"triggered": trigger, "conds" : {"Aema200": Aema200, 
    "EMA50A200": EMA50A200, "rsiB5570" : rsiB5070, "AbvAvgVolume": AbvAvgVolume, "ema21bounce": ema21bounce }};
}

module.exports = {
  CheckTrigger, createCalculateIndicators, updateAvgVolume
};