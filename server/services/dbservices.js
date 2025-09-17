const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const SaveTickerDB = async (tickers, createnew = false) => {   
 
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

        // Delete tickers not in the current list
    const validCmcIds = tickers.map(t => t.cmcId);
    await prisma.ticker.deleteMany({
      where: { cmcId: { notIn: validCmcIds } },
    });

    console.log("Tickers saved/updated")
  } catch (error) {
    throw new Error("Failed to Save tickers to database " + error.message);
  }
}


const SaveCmcGainersLosersDB = async (tickers, string) => {
  try {
    let db = null
    if (string == "gainers") {
      db = prisma.cmcGainers
    } else {
      db = prisma.cmcLosers
    }
    const tosave = []
    for (const ticker of Object.values(tickers)) {

      tosave.push({
        cmcId: ticker.id,
        price: ticker.quote["USD"].price,
        p1h_change: ticker.quote["USD"].percent_change_1h,
        p24h_change: ticker.quote["USD"].percent_change_24h,
        p7d_change: ticker.quote["USD"].percent_change_7d,
        p30d_change: ticker.quote["USD"].percent_change_30d

      })
    };
    await db.deleteMany({}) // clear the table first                 



    if (tosave.length === 0) {
      console.warn(`No ${string} to save.`);
    } else {
      await db.createMany({
        data: tosave
      })
    }

    console.log(`${string} saved`)
   
  } catch (error) {
    throw new Error("Failed to Save GainersLosers to database " + error.message);
  }
}


const SaveKrakenToDB = async (parsedCandleData) => {



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
          last2change: parseFloat(item.last2change),
          last6change: parseFloat(item.last6change),
          last144change: parseFloat(item.last144change),
          last288change: parseFloat(item.last288change),
          last100volavg: parseFloat(item.last100volavg)
   
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


await prisma.krakenCandle.deleteMany({})

    await prisma.krakenCandle.createMany({
      data: tosave      
    })

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
  let db = null
   let direction = ""
    if (string == "gainers") {
      db = prisma.cmcGainers
       direction = "desc"
       
    } else {
      db = prisma.cmcLosers
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
    const result = await db.findMany(query)
    // console.log("Get ", string, result)
    return result
  } catch (error) {
    throw new Error("Failed to retrieve Latest " + error.message);
  }
}



module.exports = {
  DeleteAllfromDB, SaveKrakenToDB, GetCandlesDB, SaveTickerDB, GetTickersDB, SaveCmcGainersLosersDB, GetCMCTopDB
};