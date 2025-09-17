const { KrakenfetchAPIData, KrakenGetAssets } = require('./APIservices/kraken');
const { CMCMapAPI } = require('./APIservices/cmc');
const { SaveKrakenToDB, DeleteAllfromDB, GetCandlesDB, SaveTickerDB, GetTickersDB, SaveCmcGainersLosersDB, GetCMCTopDB } = require('./dbservices');
const { PreprocessPairResponseData, sendNotification, CrossCheckTickers, CheckTrigger } = require('./synchelpers')

const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const UpdateGainersLosers = async () => {

  let availablepairs = await GetTickersDB() // get all available Kraken pairs
  //1 check if tickers data contains data
  if (availablepairs.length === 0) {
    console.log("No tickers in DB, saving tickers data")
    await FetchAvailableTickers(firstfetch = true) // 1 credit
    availablepairs = await GetTickersDB()
  }

  //const gainers = await CMCGainersLosers("desc");  // get top 200 CMC gainers   // 1 credit
  //fs.writeFileSync("cmcgainers.json", JSON.stringify(gainers, null, 2), "utf-8");
  const gainers = require('./testfiles/cmcgainers.json');

  //const losers = await CMCGainersLosers("asc");   // get top 200 losers // 1 credit
  const losers = require('./testfiles/cmclosers.json');

  // Crosscheck to determine which ids are available in both platforms


  const TiAtrendingpairsKrakenTicker = []
  const toscan = [gainers, losers]
  for (const set of toscan)
    for (const pair of set.data) {                
      for (const apair of availablepairs) {
        if (pair.id === apair.cmcId) {
        
          TiAtrendingpairsKrakenTicker.push(apair)
              
          break;
        }
      }
    }


  const responses = await Fetch(TiAtrendingpairsKrakenTicker); // get Kraken data

  // Preprocess the response for each ticker
  const preprocessed = PreProcess(responses)  // add candle change calculations for kraken data


  await SaveRecords(preprocessed, {"gainers":gainers, "losers": losers})  // Save into Krakencandle and CMC latest
  console.log("Successfully saved to Databases")

const RecordsObjArr = await GetRecords(); 

  //Check if any candles met the alert conditions sending notifications
  TriggerAndAlert(RecordsObjArr.toprecords)
  TriggerAndAlert(RecordsObjArr.botrecords)

  return RecordsObjArr

}

const TriggerAndAlert = async (toprecords) => {

  const triggerResults = []
  for (const gainerCoin of toprecords) {
    triggerResults.push(CheckTrigger(gainerCoin))
  }

  const coinToAlert = []
  for (const cointrigger of triggerResults) {
    if (cointrigger.trigger) {
      coinToAlert.push(cointrigger.coin)
    }
  }

  if (coinToAlert.length > 0) {
    sendNotification(coinToAlert, "Gainers");
  }


}


const PreProcess = (responses) => {
  const preprocessed = []
  for (const response of responses) {
    preprocessed.push(PreprocessPairResponseData(response)); // prepare the data from the response for storing in the DB 
    const latestCandle = preprocessed[preprocessed.length - 1].data[0]; // assign most recent candle 

    console.log(`Data for ${response.ticker.name} Preprocessed successfully`)

    // let conditions = {}
    // if (latestCandle.trigger) {
    //   console.log("Trigger detected for", response.ticker, "at", latestCandle.timestamp);
    //   if (triggerResult.uptrend.triggered) {
    //     conditions = triggerResult.uptrend.conditions
    //   } else if (triggerResult.downtrend.triggered) {
    //     conditions = triggerResult.downtrend.conditions
    //   }
    //   sendNotification(latestCandle, response.ticker, conditions);
    // }

  }
  return preprocessed
}




const FetchAvailableTickers = async (firstfetch) => {
  // Get from CMC and Kraken
  const cmc = require('./testfiles/cmcmap.json');
  //const cmc = await CMCMapAPI();        // 1 credit

  //const kraken = require('./kraken.json');
  const kraken = await KrakenGetAssets();


  const [candles, symbolmap] = CrossCheckTickers(cmc, kraken);  // crosscheck the tickers between CMC and Kraken and return only those that are in both exchanges
  const tradingPairs = []
  for (const candle of candles) {
    const symboltsave = candle.symbol in symbolmap ? symbolmap[candle.symbol] : candle.symbol

    const tickerinfo = {
      name: candle.name,
      cmcId: candle.cmcid,
      cmcticker: candle.symbol + "USD",
      krakenticker: symboltsave + "USD"
    }
    tradingPairs.push(tickerinfo);
  }

  await SaveTickerDB(tradingPairs, firstfetch)

}

const Fetch = async (TiAkrakenTickers) => {
  const result = []
  for (const t of TiAkrakenTickers) {
    console.log("Retrieving data for pair:", t.name);
    const response = await KrakenfetchAPIData(t.krakenticker);     // Fetch external API data    
    if (response.data.error.length === 0) {
      result.push({ ticker: t, data: response });
    } else {
      console.log(`error found for ${t.krakenticker} - ${response.data.error}`)
    }

    await sleep(400); // Sleep to avoid hitting the API rate limit
  }
  return result
}


const SaveRecords = async (krakenparsed, trendingobject) => {
  await SaveKrakenToDB(krakenparsed); // Attempt to save to DB and save the result to dbsave


  const validCmcIds = new Set(krakenparsed.map(krakencoin => krakencoin.ticker.cmcId));

  for (const [name, values] of Object.entries(trendingobject)) {

    const tosave = []
    for (const cmccoin of values.data) {
      if (validCmcIds.has(cmccoin.id)) {
        tosave.push(cmccoin)
      }
    }
      await SaveCmcGainersLosersDB(tickers = tosave, string = name);
      }

};

const DeleteAllRecords = async () => {
  const result = await DeleteAllfromDB();
  //console.log("delete: ", result)
  return result

};

const GetRecords = async (cmcids) => {
  const result = await GetCandlesDB(cmcids);
  const toprecords = await GetCMCTopDB(cmcids, "gainers"); // get highest gainers from cmc latest
  const botrecords = await GetCMCTopDB(cmcids, "losers"); // get biggest losers from cmc latest

  return { records: result, toprecords: toprecords, botrecords: botrecords}

};

module.exports = { DeleteAllRecords, GetRecords, FetchAvailableTickers, UpdateGainersLosers };