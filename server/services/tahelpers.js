  // --- EMA helper (last value only) ---
  function emaLast_old(values, length) {
    const k = 2 / (length + 1);
    let emaPrev = values.slice(0, length).reduce((a, b) => a + b) / length;
    for (let i = length; i < values.length; i++) {
      emaPrev = values[i] * k + emaPrev * (1 - k);
    }
    return emaPrev;
      }


function emaLast(length) {
  const k = 2 / (length + 1);
  let emaPrev = null;
  let buffer = [];

  return function update(close) {
    buffer.push(close);

    // Seed with SMA when enough candles collected
    if (emaPrev === null && buffer.length === length) {
      emaPrev = buffer.reduce((a, b) => a + b, 0) / length;
    } else if (emaPrev !== null) {
      emaPrev = (close - emaPrev) * k + emaPrev;
    }

    return emaPrev; // null until enough candles for seed
  };
}
  // --- RSI helper (last value only) ---
  function rsiLast(values, length) {
    let gains = 0, losses = 0;

    // seed averages
    for (let i = 1; i <= length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    gains /= length;
    losses /= length;

    // update to last
    for (let i = length + 1; i < values.length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff >= 0) {
        gains = (gains * (length - 1) + diff) / length;
        losses = (losses * (length - 1)) / length;
      } else {
        gains = (gains * (length - 1)) / length;
        losses = (losses * (length - 1) - diff) / length;
      }
    }

    const rs = gains / (losses || 1); // avoid div by zero
    return 100 - 100 / (1 + rs);
  }

module.exports = {
  emaLast, rsiLast
};