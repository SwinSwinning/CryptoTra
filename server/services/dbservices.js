const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SaveTickerDB = async (tickers) => {   // Update so it only adds new tickers

     
  try {

    const tosave = []
    for (const ticker of tickers) {
      tosave.push({
        cmcticker: ticker.cmcsymbol,
        krakenticker: ticker.kraksymbol,
        name: ticker.name,
        cmcid: ticker.cmcid

      })
    };

    await prisma.ticker.createMany({
      data: tosave
    })
    console.log("Tickers saved")
  } catch (error) {
    throw new Error("Failed to Save tickers to database " + error.message);
  }
}


const SaveLatestCMCDB = async (tickers) => {
  try {
    const tosave = []

    for (const ticker of Object.values(tickers.data)) {

      tosave.push({
        cmcid: ticker.id,
        price: ticker.quote["USD"].price,
        p1h_change: ticker.quote["USD"].percent_change_1h,
        p24h_change: ticker.quote["USD"].percent_change_24h,
        p7d_change: ticker.quote["USD"].percent_change_7d,
        p30d_change: ticker.quote["USD"].percent_change_30d

      })
    };
    await prisma.cmcLatest.deleteMany({}) // clear the table first

    await prisma.cmcLatest.createMany({
      data: tosave
    })
    console.log("Tickers saved")
  } catch (error) {
    throw new Error("Failed to Save tickers to database " + error.message);
  }
}


const SaveKrakenToDB = async (parsedCandleData) => {
  // console.log("Saving to DB", candles[0])


  try {
    const tosave = []
    for (const pairdata of parsedCandleData) {
      const ticker = pairdata.ticker
      const name = pairdata.tickername
      Object.values(pairdata.data).forEach(item => {
        tosave.push({
          ticker: ticker,
          timestamp: item.timestamp,
          name: name,
          price: parseFloat(item.close),
          volume: parseFloat(item.volume),
          ema21: parseFloat(item.ema21),
          ema50: parseFloat(item.ema50),
          ema200: parseFloat(item.ema200),
          rsi14: parseFloat(item.rsi14),
          last1change: parseFloat(item.last1change),
          last77change: parseFloat(item.last77change),
          last144change: parseFloat(item.last144change),
          last288change: parseFloat(item.last288change),
          trigger: item.trigger,
        })
      })
    };

    // Build raw SQL
    const valuesSQL = tosave
      .map(c => `(
    '${c.ticker}',
    ${c.timestamp},
    '${c.name}',
    ${c.price},
    ${c.volume},
    ${c.ema21},
    ${c.ema50},
    ${c.ema200},
    ${c.rsi14},
    ${c.last1change},
    ${c.last77change},
    ${c.last144change},
    ${c.last288change},
    ${c.trigger}
  )`).join(",");

    // Execute raw SQL to insert data because sqlite does not support ON CONFLICT DO NOTHING
    await prisma.$executeRawUnsafe(`
  INSERT OR IGNORE INTO KrakenCandle
    (ticker, timestamp, name, price, volume, ema21, ema50, ema200, rsi14, last1change, last77change, last144change, last288change, trigger)
  VALUES ${valuesSQL}
`);

    // await prisma.krakencandle.createMany({
    //   data: tosave      
    // })

    // return { success: true, msg: "Data saved successfully to database" }
  } catch (error) {
    console.error('Failed to save data to database:', error);
    throw new Error("Failed to Save to database " + error.message); // Return an error object
  }
};

const DeleteAllfromDB = async () => {

  try {
    return await prisma.krakenCandle.deleteMany({})

  } catch (error) {
    console.error('Error deleting data from database:', error);
    throw new Error("Failed to Delete from database " + error.message);

  }

};

const GetCandlesDB = async (ticker = null) => {
  try {
    // const total_records = await prisma.candle.count(); // Get the total number of records

    const query = {
      orderBy: [{ timestamp: 'desc' }],
    };
    if (ticker) {
      query.where = { ticker };
    }
    const candles = await prisma.krakenCandle.findMany(query)
    return candles; // Return the retrieved data 

  } catch (error) {
    console.error('Error retrieving from database:', error);
    throw new Error("Failed to Retrieve from database " + error.message);
  }

};

const GetTickersDB = async () => {
  try {
    const tickers = await prisma.ticker.findMany()
    console.log("Tickers retrieved,", tickers.length)
    return tickers
  } catch (error) {
    throw new Error("Failed to retrieve tickers " + error.message);
  }
}

const GetTopDB = async (string) => {
  let direction = ""
  if (string === "gainers") {
    direction = "desc"

  } else if (string === "losers") {
    direction = "asc"
  }

  try {
    const query = {
      include: {
        ticker: {
          include: {
            krakenCandle: {
              orderBy: { timestamp: "desc" },
              take: 1
            }
          }
        }
      },

      orderBy: [{ p1h_change: direction }],
      take: 2
    };
    const result = await prisma.cmcLatest.findMany(query)
    // console.log("Get ", string, result)
    return result
  } catch (error) {
    throw new Error("Failed to retrieve Latest " + error.message);
  }
}



module.exports = {
  DeleteAllfromDB, SaveKrakenToDB, GetCandlesDB, SaveTickerDB, GetTickersDB, SaveLatestCMCDB, GetTopDB
};