const { KrakenfetchAPIData, KrakenGetAssets } = require('./APIservices/kraken');
const { CMCGainersLosers, CMCfetchAPIData, CMCMapAPI } = require('./APIservices/cmc');
const { SaveKrakenToDB, DeleteAllfromDB, GetCandlesDB, SaveTickerDB, GetTickersDB, SaveCmcGainersLosersDB, GetCMCTopDB } = require('./dbservices');
const { PreprocessPairResponseData, sendNotification, CrossCheckTickers, CheckTrigger } = require('./synchelpers')

const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const UpdateGainersLosers = async () => {

    let availablepairs = await GetTickersDB() // get all available Kraken pairs
  //1 check if tickers data contains data
  if (availablepairs.length === 0) {
    console.log("No tickers in DB, saving tickers data")
    await FetchAvailableTickers(firstfetch=true) // 1 credit
    availablepairs = await GetTickersDB()
  }

  const gainers = await CMCGainersLosers("desc");  // get top 200 CMC gainers   // 1 credit
  // fs.writeFileSync("cmcgainers.json", JSON.stringify(gainers, null, 2), "utf-8");
  //const gainers = require('./cmcgainers.json');

  // const losers = await CMCGainersLosers("asc");   // get top 200 losers // 1 credit
  //const losers = require('./cmclosers.json');    



  // Crosscheck to determine which ids are available in both platforms
  const cmcids = []
  const TiAtrendingpairsKrakenTicker = []

  for (const pair of gainers.data) {                // add a loop so it also checks for losers
    for (const apair of availablepairs) {
      if (pair.id === apair.cmcId) {
     
        cmcids.push(pair.id)
        TiAtrendingpairsKrakenTicker.push(apair)
        //console.log("matched", pair.name)     
        break;
      }
    }
  }
//console.log(cmcids)
  // filter full ticker table with the cmcids that were found in both platforms
  //const trendingpairs = await GetTickersDB(cmcids)   // perhaps not needed

  //get fitered cmc data
  //const latest = await FetchCMC(cmcids); //  1 credit
  //const latest = require('./cmclatestquotes.json'); // get CMC data      Do I really need this?!!?!

  const responses = await Fetch(TiAtrendingpairsKrakenTicker); // get Kraken data

  // Preprocess the response for each ticker
  const preprocessed = PreProcess(responses)  // add candle change calculations for kraken data



  await SaveRecords(preprocessed, gainers)  // Save into Krakencandle and CMC latest
  console.log("Successfully saved to Databases")



  const maxtoreturn = 10
  const RecordsObjArr = await GetRecords((cmcids.slice(0, maxtoreturn))); // get from kraken candle table filtered on cmcids
   
  
  //Check if any candles met the alert conditions sending notifications
  
  TriggerAndAlert(RecordsObjArr.toprecords)

  return RecordsObjArr


}

const TriggerAndAlert = async (toprecords) => {

const triggerResults = []
  for(const gainerCoin of toprecords) {
        triggerResults.push(CheckTrigger(gainerCoin))
  }

  const coinToAlert = []
  for (const cointrigger of triggerResults){
          if(cointrigger.trigger){
            coinToAlert.push(cointrigger.coin)
        }
  }

    if (coinToAlert.length > 0){
      sendNotification(coinToAlert, "Gainers");
    }


}

const HandleRet = async () => {
  // 1. Fetching and Preprocessing for storage into db
  // const tradingpairs = [{id: 1, cmcid: 1, name: 'Bitcoin', cmcticker: 'BTCUSD', krakenticker: 'XBTUSD'},
  // {id: 2, cmcid: 1027, name: 'Ethereum', cmcticker: 'ETHUSD', krakenticker: 'ETHUSD'}]

  let tradingpairs = await GetTickersDB() // || tradingPairs;    // uncomment < ---------------------------
  //1 check if tickers data contains data
  if (tradingpairs.length === 0) {
    console.log("No tickers in DB, saving tickers data")
    tradingpairs = await FetchAvailableTickers()
  }



  //const latest = await FetchCMC(tradingpairs); 
  const latest = require('./cmclatestquotes.json'); // get CMC data

  const responses = await Fetch(tradingpairs); // get Kraken data


  // 2. Preprocess the response for each ticker
  const preprocessed = PreProcess(responses)



  // 5. Storing into databases
  console.log("Storing into Databases")
  await SaveRecords(preprocessed, latest)
  console.log("Successfully saved to Database")



  // 6. Returning all records from Database
  const records = await GetRecords();
  console.log("Successfully retrieved records from Database")
  return records




};

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


const MergeAPIData = async () => {
  const tickers = await GetTickersDB()
  const existingtickers = []
  for (const ticker of tickers) {
    console.log("checking :", ticker.krakenticker)


  }
  console.log(tradingpairsArr)
  // First check if each pair exists in db

  const result = []
  for (const pair of tradingpairsArr) {
    console.log("Retrieving data for pair:", pair);
    const response = await fetchAPIData(pair);     // Fetch external API data    

    result.push({ ticker: pair, data: response });
    await sleep(800); // Sleep to avoid hitting the API rate limit
  }
  return result
}

const FetchAvailableTickers = async (firstfetch) => {
  // Get from CMC and Kraken
  //const cmc = require('./cmcmap.json');
  const cmc = await CMCMapAPI();        // 1 credit

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

const FetchCMC = async (cmcIDs) => {

  const result = await CMCfetchAPIData(cmcIDs)

  return result


}

const Fetch = async (TiAkrakenTickers) => {
  const result = []
  for (const t of TiAkrakenTickers) {
    console.log("Retrieving data for pair:", t.name);
    const response = await KrakenfetchAPIData(t.krakenticker);     // Fetch external API data    
    if (response.data.error.length === 0){
      result.push({ ticker: t, data: response });
    } else {
      console.log(`error found for ${t.krakenticker} - ${response.data.error}`)
    }
    
    await sleep(400); // Sleep to avoid hitting the API rate limit
  }
  return result
}


const SaveRecords = async (krakenparsed, cmcgainers) => {

  //  const validCmcIds = []
   
  //  for (const krakencoin of krakenparsed){
  //   validCmcIds.push(krakencoin.ticker.cmcId)
  //  }

const validCmcIds = new Set(krakenparsed.map(krakencoin => krakencoin.ticker.cmcId));

    const tosave = []   

    for (const cmccoin of cmcgainers.data) {
      if (validCmcIds.has(cmccoin.id)) {
        tosave.push(cmccoin)
      } 
    }
  
  await SaveKrakenToDB(krakenparsed); // Attempt to save to DB and save the result to dbsave
 await SaveCmcGainersLosersDB(tickers=tosave, string="gainers");
  //console.log("missing Ticker: ", missingGainers)

};

const DeleteAllRecords = async () => {
  const result = await DeleteAllfromDB();
  //console.log("delete: ", result)
  return result

};

const GetRecords = async (cmcids) => {
  const result = await GetCandlesDB(cmcids);
  const toprecords = await GetCMCTopDB(cmcids, "gainers"); // get highest gainers from cmc latest

  return {records: result, toprecords: toprecords}

};

module.exports = { DeleteAllRecords, GetRecords, HandleRet, FetchAvailableTickers, UpdateGainersLosers };