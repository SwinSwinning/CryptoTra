function ema(data, period) {
  const k = 2 / (period + 1);
  let emaArr = [];
  let emaPrev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      emaArr.push(null);
    } else if (i === period - 1) {
      emaArr.push(emaPrev);
    } else {
      emaPrev = data[i] * k + emaPrev * (1 - k);
      emaArr.push(emaPrev);
    }
  }
  return emaArr;
}

function rsi(data, period) {
  let gains = [], losses = [], rsis = [];

  for (let i = 1; i < data.length; i++) {
    const delta = data[i] - data[i - 1];
    gains.push(delta > 0 ? delta : 0);
    losses.push(delta < 0 ? -delta : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  rsis.push(null, ...Array(period - 1).fill(null));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgGain / (avgLoss || 1e-10);
    rsis.push(100 - 100 / (1 + rs));
  }

  return rsis;
}

function checkTrigger(data) {
  const closes = data.map(d => d.close);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);

  const ema21 = ema(closes, 21);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const rsi14 = rsi(closes, 14);

  const avgVol20 = volumes.map((_, i) =>
    i < 19 ? null : volumes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20
  );

  const i = data.length - 1;
  const last = data[i];
  const prev = data[i - 1];

  const cond1 = closes[i] > ema200[i];
  const cond2 = ema50[i] > ema200[i];
  const cond3 = lows[i] <= ema21[i] && closes[i] > ema21[i];
  const cond4 = rsi14[i] >= 55 && rsi14[i] <= 70 && rsi14[i] > rsi14[i - 1];
  const cond5 = volumes[i] > avgVol20[i];

  const trigger = cond1 && cond2 && cond3 && cond4 && cond5;

  return { trigger, cond1 } //,cond2, cond3, cond4, cond5 };
}

module.exports = {
  checkTrigger
};