// Create stateful calculators ONCE outside the loop
function createEmaCalculator(length) {
  const k = 2 / (length + 1);
  let emaPrev = null;
  let count = 0;
  let sum = 0;

  return function update(close) {
    count++;

    if (emaPrev === null) {
      sum += close;
      if (count === length) {
        emaPrev = sum / length; // seed SMA
        return emaPrev;
      }
      return 0; // warm-up
    }

    emaPrev = (close - emaPrev) * k + emaPrev;
    return emaPrev;
  };
}


function createRsiCalculator(length) {
  let avgGain = null;
  let avgLoss = null;
  let prevClose = null;
  let count = 0;

  return function update(close) {
    if (prevClose === null) {
      prevClose = close;
      return 0; // not enough data yet
    }

    const change = close - prevClose;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    count++;

    if (avgGain === null) {
      // Warm-up period: use SMA for first `length` candles
      if (count <= length) {
        avgGain = (avgGain ?? 0) + gain;
        avgLoss = (avgLoss ?? 0) + loss;

        if (count === length) {
          avgGain /= length;
          avgLoss /= length;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          prevClose = close;
          return 100 - 100 / (1 + rs);
        }
        prevClose = close;
        return 0; // still warming up
      }
    } else {
      // Wilder’s smoothing
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
    }

    prevClose = close;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };
}




module.exports = {
  createEmaCalculator, createRsiCalculator
};