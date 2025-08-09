const { createRsiCalculator, createEmaCalculator } = require('./tahelpers'); // move to sync



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



function CheckTrigger(data) {   // Array of at least 200 candles, ordered from oldest to newest

  // const closes = data.map(d => Number(d.close));
  // const lows = data.map(d =>  Number(d.low));
  // const volumes = data.map(d =>  Number(d.volume));

  // const ema21 = ema(closes, 21);
  // const ema50 = ema(closes, 50);
  // const ema200 = ema(closes, 200);
  // const rsi14 = rsi(closes, 14);

  const avgVol100 = volumes.map((_, i) =>
    i < 99 ? null : volumes.slice(i - 99, i + 1).reduce((a, b) => a + b, 0) / 100
  );

  // const current = data[0];
  // console.log(`${current.timestamp} - Volume ${volumes[current]}`)

  const i = data.length - 1;
  const last = data[i];
  const prev = data[i + 1];

  //console.log(`${last.timestamp} - Volume ${volumes[i]} Avg Volume ${avgVol100[i]}`)
  const AbvAvgVolume = volumes[i] > avgVol100[i]; // Current volume above 100-period average volume  - checked


  const Aema200 = closes[i] > ema200[i]; // Current close above EMA200
  // console.log(`${last.timestamp} - close ${closes[i]} ema 200 ${ema200[i]} - trigger ${Aema200}`) - checked

  const EMA50A200 = ema50[i] > ema200[i]; // EMA50 above EMA200
  console.log(data.length)

  console.log(`${last.timestamp} - ema50 ${ema50[i]} ema200 ${ema200[i]} - trigger ${EMA50A200}`)

  const rsiB5570 = rsi14[i] >= 55 && rsi14[i] <= 70 && rsi14[i] > rsi14[i - 1];   // RSI between 55 and 70 and increasing


  const ema21bounce = lows[i] <= ema21[i] && closes[i] > ema21[i]; // Current low below EMA21 and close above EMA21

  //const trigger = cond1 && cond2 && cond3 && cond4 //&& cond5;

  return { Aema200, EMA50A200, rsiB5570, AbvAvgVolume, ema21bounce };
}

module.exports = {
  CheckTrigger, createCalculateIndicators
};