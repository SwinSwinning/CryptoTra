const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// const SaveTickerDB = async (tickers) => {   // Update so it only adds new tickers
//   try {
//     const tosave = []
//     for (const ticker of tickers) {
//       tosave.push({
//         cmcticker: ticker.cmcsymbol,
//         krakenticker: ticker.kraksymbol,
//         name: ticker.name,
//         cmcid: ticker.cmcid
//       })
//     };

//     await prisma.ticker.createMany({
//       data: tosave
//     })
//     console.log("Tickers saved")
//   } catch (error) {
//     throw new Error("Failed to Save tickers to database " + error.message);
//   }
// }

const SaveTickerDB = async (tickers, createnew = false) => {   // Update so it only adds new tickers
  console.log(tickers)
  try {
    if (createnew) {
      const tosave = []
      for (const ticker of tickers) {
        tosave.push({
          cmcticker: ticker.cmcticker,
          krakenticker: ticker.krakenticker,
          name: ticker.name,
          cmcId: ticker.cmcId
        })
      };

      await prisma.ticker.createMany({
        data: tosave
      })

    } else {
      for (const t of tickers) {
        await prisma.ticker.upsert({
          where: { cmcId: t.cmcId },
          update: {
            name: t.name,
            cmcticker: t.cmcticker,
            krakenticker: t.krakenticker,
          },
          create: t,
        });
      }
    };

    console.log("Tickers saved/updated")
  } catch (error) {
    throw new Error("Failed to Save tickers to database " + error.message);
  }
}

const SaveTopDB = async (toprecords, string) => {
  try {
    let db = null
    if (string == "gainers") {
      db = prisma.gainers
    } else {
      db = prisma.losers
    }
    const tosave = []
    for (const ticker of toprecords) {

      tosave.push({
        cmcId: ticker.cmcId,
        candleId: ticker.id,

      })
    };
    await db.deleteMany({});

    await db.createMany({
      data: tosave
    });

  } catch (error) {
    throw new Error("Failed to Save top to database " + error.message);
  }
}

const SaveLatestCMCDB = async (tickers) => {
  try {
    const tocheck = []
    for (const ticker of Object.values(tickers.data)) {

      tocheck.push({
        cmcId: ticker.id,
        price: ticker.quote["USD"].price,
        p1h_change: ticker.quote["USD"].percent_change_1h,
        p24h_change: ticker.quote["USD"].percent_change_24h,
        p7d_change: ticker.quote["USD"].percent_change_7d,
        p30d_change: ticker.quote["USD"].percent_change_30d

      })
    };
    await prisma.cmcLatest.deleteMany({}) // clear the table first

    const existingtickers = await prisma.ticker.findMany({
      select: { cmcId: true },
    });
    const validCmcIds = new Set(existingtickers.map(item => item.cmcId));

    const tosave = []
    const missing = []

    for (const item of tocheck) {
      if (validCmcIds.has(item.cmcId)) {
        tosave.push(item)
      } else {
        missing.push(item.cmcId)
      }
    }

    if (tosave.length === 0) {
      console.warn(`No valid tickers to save.`);
    } else {
      await prisma.cmcLatest.createMany({
        data: tosave
      })
    }

    console.log("Tickers saved")
    return missing
  } catch (error) {
    throw new Error("Failed to Save tickers to database " + error.message);
  }
}


const SaveKrakenToDB = async (parsedCandleData) => {
  // console.log("Saving to DB", candles[0])


  try {
    const tocheck = []
    for (const pairdata of parsedCandleData) {
      const ticker = pairdata.ticker.id

      Object.values(pairdata.data).forEach(item => {
        tocheck.push({
          tickerId: ticker,
          timestamp: item.timestamp,
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

    const existingtickers = await prisma.ticker.findMany({
      select: { id: true },
    });
    const validTickerId = new Set(existingtickers.map(item => item.id));

    const tosave = []
    const missing = []

    for (const item of tocheck) {
      if (validTickerId.has(item.tickerId)) {
        tosave.push(item)
      } else {
        missing.push(item.tickerId)
      }
    }




    // Build raw SQL
    const valuesSQL = tosave
      .map(c => `(
    '${c.tickerId}',
    ${c.timestamp},
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
    (tickerId, timestamp, price, volume, ema21, ema50, ema200, rsi14, last1change, last77change, last144change, last288change, trigger)
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

const GetCandlesDB = async (cmcids = null) => {
  try {
    const query = {
      orderBy: [{ timestamp: 'desc' }],
      where: {}
    };
    // if (ticker) {
    //   query.where = { ticker };
    // }

    if (cmcids && cmcids.length > 0) {
      query.where.tickerRel = {
        cmcId: { in: cmcids },
      };
    }
    const candles = await prisma.krakenCandle.findMany(query)
    return candles; // Return the retrieved data 

  } catch (error) {
    console.error('Error retrieving from database:', error);
    throw new Error("Failed to Retrieve from database " + error.message);
  }

};

const GetTopDB = async (string) => {
  const db = string === "gainers" ? prisma.gainers : prisma.losers
  const direction = string === "gainers" ? "desc" : "asc"
  try {
    const query = {
      include: {
        cmcLatest: {
          include: {
            ticker: {
              include: {
                krakenCandle: {
                  orderBy: { timestamp: "desc" },
                  take: 1
                }
              }
            }
          }
        }
      },

      orderBy: {
        cmcLatests: {
          _max: {
            p1h_change: direction
          },
        },
      },
      take: 4,
      where: {}
    };
    const candles = await db.findMany(query)
    return candles;
  } catch (error) {
    throw new Error("Failed to retrieve top " + error.message);
  }

}

const GetTickersDB = async (cmcids) => {
  try {
    const whereClause = cmcids && cmcids.length > 0    // Change this to match the others using query
      ? { cmcId: { in: cmcids } }
      : {};

    const tickers = await prisma.ticker.findMany({
      where: whereClause
    })
    console.log("Tickers retrieved,", tickers.length)
    return tickers
  } catch (error) {
    throw new Error("Failed to retrieve tickers " + error.message);
  }
}

const GetCMCTopDB = async (cmcids = null, string, max = 10) => {
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
      take: max,
      where: {}
    };
    if (cmcids && cmcids.length > 0) {
      query.where.ticker = {
        cmcId: { in: cmcids },
      };
    }
    const result = await prisma.cmcLatest.findMany(query)
    // console.log("Get ", string, result)
    return result
  } catch (error) {
    throw new Error("Failed to retrieve Latest " + error.message);
  }
}



module.exports = {
  DeleteAllfromDB, SaveKrakenToDB, GetCandlesDB, SaveTickerDB, GetTickersDB, SaveLatestCMCDB, GetCMCTopDB, SaveTopDB, GetTopDB
};