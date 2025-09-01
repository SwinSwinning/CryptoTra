const { fetchAPIData } = require('./APIservices/kraken');
const { SaveToDB, DeleteAllfromDB, GetCandlesDB } = require('./dbservices');
const { PreprocessPairResponseData, sendNotification, CheckTrigger } = require('./synchelpers')

const tradingPairs = require('../tradingpairs.json')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const HandleRet = async () => {
  // 1. Fetching and Preprocessing for storage into db
  const tradingpairs = tradingPairs;
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

  // 4. Storing into database
  console.log("Storing into Database")
  await SaveRecords(preprocessed)
  console.log("Successfully saved to Database")

  // 5. Returning all records from Database
  const records = await GetRecords();
  console.log("Successfully retrieved records from Database")
  return records


};

const Fetch = async (tradingpairsArr) => {

  const result = []
  for (const pair of tradingpairsArr) {
    console.log("Retrieving data for pair:", pair);
    const response = await fetchAPIData(pair);     // Fetch external API data    
 
    result.push({ ticker: pair, data: response });
    await sleep(800); // Sleep to avoid hitting the API rate limit
  }
  return result
}

const SaveRecords = async (parsed) => {
  const result = await SaveToDB(parsed); // Attempt to save to DB and save the result to dbsave
  console.log("SaveRecords: ", result)
  return result
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

module.exports = { DeleteAllRecords, GetRecords, HandleRet };