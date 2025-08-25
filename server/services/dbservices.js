const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SaveToDB = async (parsedCandleData) => {
  // console.log("Saving to DB", candles[0])

  try {
    const tosave = []
    for (const pairdata of parsedCandleData) {
      const ticker = pairdata.ticker
      Object.values(pairdata.data).forEach(item => {      
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
  INSERT OR IGNORE INTO Candle
    (ticker, timestamp, name, price, volume, ema21, ema50, ema200, rsi14, last1change, last77change, last144change, last288change, trigger)
  VALUES ${valuesSQL}
`);

    
    // return { success: true, msg: "Data saved successfully to database" }
  } catch (error) {
    console.error('Failed to save data to database:', error);
       throw new Error("Failed to Save to database " + error.message); // Return an error object
  }
};

const DeleteAllfromDB = async () => {

  try {
    return await prisma.candle.deleteMany({})

  } catch (error) {
    console.error('Error deleting data from database:', error);    
    throw new Error("Failed to Delete from database " + error.message); 

  }

};

const GetCandlesDB = async (ticker=null) => {
  try {
    // const total_records = await prisma.candle.count(); // Get the total number of records

    const query = {
      orderBy: [{ timestamp: 'desc' }],
    };
    if (ticker) {
      query.where = { ticker };
    }
      const candles = await prisma.candle.findMany(query)
    return candles; // Return the retrieved data 

  } catch (error) {
    console.error('Error retrieving from database:', error);
    throw new Error("Failed to Retrieve from database " + error.message); 
  }

};


module.exports = {
  SaveToDB, DeleteAllfromDB, GetCandlesDB
};