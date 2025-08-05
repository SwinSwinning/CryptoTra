const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SaveToDB = async (candles) => {
  // console.log("Saving to DB", candles[0])

  try {
    const tosave = []
    for (const candle of candles) {
      const ticker = candle.ticker
      Object.values(candle.data).forEach(item => {      
        tosave.push({
          ticker: ticker,
          timestamp: item.timestamp,
          name: ticker,
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
    ${c.last288change}
  )`).join(",");

  // Execute raw SQL to insert data because sqlite does not support ON CONFLICT DO NOTHING
  await prisma.$executeRawUnsafe(`
  INSERT OR IGNORE INTO Candle
    (ticker, timestamp, name, price, volume, ema21, ema50, ema200, rsi14, last1change, last77change, last144change, last288change)
  VALUES ${valuesSQL}
`);
    // await prisma.candle.createMany({
    //   data: tosave      
    // })

    
    return { success: true, msg: "Data saved successfully to database" }
  } catch (error) {
    console.error('Failed to save data to database:', error);
    return { success: false, msg: "Failed to save data to database" + error }; // Return an error object
  }
};

const DeleteAllfromDB = async () => {

  try {
    await prisma.candle.deleteMany({})
    return {success: true, msg:"Successfully Cleared the Database"} ; 

  } catch (error) {
    console.error('Error deleting data from database:', error);
    throw new Error("Failed to Delete from database " + error.message); // Return an error object
  }

};

const GetAllFromDB = async (pagenumber, maxrecords) => {


  try {
    const total_records = await prisma.candle.count(); // Get the total number of records
    candles = await prisma.candle.findMany({
      orderBy: [
        {
          timestamp: 'desc',
        }
      ]
    })

    return { success: true, msg: "All records from DB retrieved", data: candles, count: total_records }; // Return the retrieved data 

  } catch (error) {
    console.error('Error retrieving from database:', error);
    return { success: false, msg: "Failed to retrieve from database" }; // Return an error object
  }

};

const GetFiltered = async (ticker) => {

  try {
    filteredcandles = await prisma.candle.findMany({
      orderBy: [
        {
          timestamp: 'desc',
        }
      ],
      where: {
        ticker: ticker,
      },
    })
    return { success: true, msg: "Record(s) found and returned", data: filteredcandles }; // Return the retrieved data
  } catch (error) {
    console.error('REcord not found:', error);
    return { success: false, msg: "record not found" }; // Return an error object

  }

};


const getFullHistoryFlags = async (tickers, thresholdSeconds) => {
  const now = Math.floor(Date.now() / 1000);

  const latestPerPair = await prisma.candle.groupBy({
    by: ['ticker'],
    _max: { timestamp: true }
  });

  const latestMap = Object.fromEntries(
    latestPerPair.map(e => [e.ticker, e._max.timestamp])
  );

  const result = {};
  for (const ticker of tickers) {
    const latest = latestMap[ticker];
    result[ticker] = !latest || (now - latest > thresholdSeconds);
  }

  return result; // { XBTUSDT: true, ETHUSDT: false, ... }
};

module.exports = {
  getFullHistoryFlags, SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered
};