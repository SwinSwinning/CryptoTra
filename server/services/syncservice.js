const { KrakenfetchAPIData, KrakenGetAssets } = require('./APIservices/kraken');
const { CMCGainersLosers, CMCfetchAPIData } = require('./APIservices/cmc');
const { SaveKrakenToDB, DeleteAllfromDB, GetCandlesDB, SaveTickerDB, GetTickersDB,SaveLatestCMCDB, GetTopDB } = require('./dbservices');
const { PreprocessPairResponseData, sendNotification, CrossCheckTickers } = require('./synchelpers')

const tradingPairs = require('../tradingpairs.json')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const UpdateGainersLosers = async () => {
  // const gainers = await CMCGainersLosers("desc");
  // const losers = await CMCGainersLosers("asc");

  const gainers = require('./cmcgainers.json');
  const losers = require('./cmclosers.json');       // make separate tables < ----------------------- start erhe

  const kraken = await GetTickersDB()
  // Do crosscheck with kraken tickers
  const [candles, symbolmap] = CrossCheckTickers(gainers, kraken);
  //const [candles, symbolmap] = CrossCheckTickers(losers, kraken);

  //return {gainers: gainers, losers: losers }
 return candles

}

const HandleRet = async () => {
  // 1. Fetching and Preprocessing for storage into db
// const tradingpairs = [{id: 1, cmcid: 1, name: 'Bitcoin', cmcticker: 'BTCUSD', krakenticker: 'XBTUSD'},
// {id: 2, cmcid: 1027, name: 'Ethereum', cmcticker: 'ETHUSD', krakenticker: 'ETHUSD'}]

let tradingpairs = await GetTickersDB() // || tradingPairs;    // uncomment < ---------------------------
    //1 check if tickers data contains data
   if( tradingpairs.length === 0) {
    console.log("No tickers in DB, saving tickers data")
    tradingpairs = await FetchAvailableTickers()
   }

 

//const latest = await FetchCMC(tradingpairs); 
const latest = require('./cmclatestquotes.json');
const responses = await Fetch(tradingpairs);
  

  // 2. Preprocess the response for each ticker
  const preprocessed = []
  for (const response of responses) {
    preprocessed.push(PreprocessPairResponseData(response)); // prepare the data from the response for storing in the DB 
    const latestCandle = preprocessed[preprocessed.length - 1].data[0]; // assign most recent candle 
    const triggerResult = preprocessed[preprocessed.length - 1].triggerobj; // 
    console.log(`Data for ${response.ticker} Preprocessed successfully`)



    // 3. Sending notifications if triggers for each ticker
    let conditions = {}
    if (latestCandle.trigger) {
      console.log("Trigger detected for", response.ticker, "at", latestCandle.timestamp);
      if (triggerResult.uptrend.triggered) {
        conditions = triggerResult.uptrend.conditions
      } else if (triggerResult.downtrend.triggered) {
        conditions = triggerResult.downtrend.conditions
      }
      sendNotification(latestCandle, response.ticker, conditions);
    }
  }



  // 5. Storing into databases
  console.log("Storing into Databases")
  await SaveRecords(preprocessed, latest)
  console.log("Successfully saved to Database")


    //6 Set the gainers and losers    I do this somewhere else now
    // const gainers = await GetTopDB("gainers");
    // const losers = await GetTopDB("losers");
    
  

  // 6. Returning all records from Database
  const records = await GetRecords();
  console.log("Successfully retrieved records from Database")
  return records


  

};

const MergeAPIData = async () => {
  const tickers = await GetTickersDB()
  const existingtickers = []
  for(const ticker of tickers) {
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

const FetchAvailableTickers = async () => {    // this is run once ever week or so
  // Get from CMC and Kraken
  const cmc = require('./cmcmap.json');
  //const cmc = await CMCGainersLosers();

  //const kraken = require('./kraken.json');
  const kraken = await KrakenGetAssets();


  const [candles, symbolmap] = CrossCheckTickers(cmc, kraken.data.result);  // crosscheck the tickers between CMC and Kraken and return only those that are in both exchanges
  const tradingPairs = []
  for (const candle of candles) {
    const symboltsave = candle.symbol in symbolmap ? symbolmap[candle.symbol] : candle.symbol

    const tickerinfo = {
      name: candle.name,
      cmcid: candle.cmcid,      
      cmcsymbol: candle.symbol +"USD",
      kraksymbol: symboltsave + "USD"
    }
    tradingPairs.push(tickerinfo);
  }

  await SaveTickerDB(tradingPairs)
  return tradingPairs
}

const FetchCMC = async (tradingpairsArr) => {

  const cmcIDs = []
  for (const pair of tradingpairsArr) {
    cmcIDs.push(pair.cmcid)
  }

const result = await CMCfetchAPIData(cmcIDs)

  return result


}

const Fetch = async (tradingpairsArr) => {
  const result = []
  for (const pair of tradingpairsArr) {
    console.log("Retrieving data for pair:", pair.name);
    const response = await KrakenfetchAPIData(pair.krakenticker);     // Fetch external API data    

    result.push({ ticker: pair.krakenticker, name:  pair.name, data: response });
    await sleep(400); // Sleep to avoid hitting the API rate limit
  }
  return result
}


const SaveRecords = async (krakenparsed, cmclatest) => {
  await SaveKrakenToDB(krakenparsed); // Attempt to save to DB and save the result to dbsave
  await SaveLatestCMCDB(cmclatest);

};

const DeleteAllRecords = async () => {
  const result = await DeleteAllfromDB();
  //console.log("delete: ", result)
  return result

};

const GetRecords = async () => {
  const result = await GetCandlesDB();
  //console.log("GetRecords: ", result)
  return result

};

module.exports = { DeleteAllRecords, GetRecords, HandleRet, FetchAvailableTickers, UpdateGainersLosers };