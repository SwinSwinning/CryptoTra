const { fetchAPIData } = require('./APIservices/kraken');
const { SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered } = require('./dbservices');
const { PreprocessPairResponseData, sendNotification, CheckTrigger } = require('./synchelpers')


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const HandleRet = async () => {

  // 1. Fetching and Preprocessing for storage into db
  const tradingpairs = ['ETHUSDT', 'XBTUSDT'];
  const response = await Fetch(tradingpairs);
  if (!response.success) {
    return response
  }

  const preprocessed = []
  for (const pair of response.data) {
    // 2. Preprocess the response  

    // Get the latest candle from the preprocessed data
    preprocessed.push(PreprocessPairResponseData(pair)); // prepare the data from the response for storing in the DB 
    const latestCandle = preprocessed[preprocessed.length - 1].data[0];
    const triggerResult = preprocessed[preprocessed.length - 1].triggerobj;
    console.log(`Data for ${pair.ticker} Preprocessed successfully`)

    try {

      // 3. Sending notifications for triggers
      console.log("Sending notifications for triggers")
      if (!latestCandle.trigger) {                      // Change this 
        const conditions = triggerResult.downtrend.triggered ? triggerResult.downtrend.conditions :triggerResult.uptrend.conditions
 


        console.log("Trigger detected for", pair.ticker, "at", latestCandle.timestamp);
        sendNotification(latestCandle, pair.ticker, conditions);
      }
    } catch (error) {
      console.log(error);
    }

  }
  // 4. Storing into database
  console.log("Storing into Database")
  const savedtodb = await SyncSave(preprocessed)
  if (!savedtodb.success) {
    return savedtodb.msg
  }
  console.log("Successfully saved to Database")



  // 5. Returning all records from Database
  const records = await GetRecords();
  if (!records.success) {
    return records.msg
  }
  console.log("Successfully retrieved records from Database")
  return records


};

const Fetch = async (tradingpairsArr) => {

  try {
    const parsed = []
    for (const pair of tradingpairsArr) {

      // 1. Fetch external API data    
      console.log("Retrieving data for pair:", pair);
      const response = await fetchAPIData(pair);
      if (!response.success) { // If the API fetch response is unsuccessful, return the error message       
        return {
          success: false, msg: response.msg, data: response.data
        }
      };
      parsed.push({ ticker: pair, data: response });
      await sleep(800); // Sleep to avoid hitting the API rate limit
    }
    return {
      success: true, msg: "All Pairs fetched", data: parsed
    }

  } catch (error) {
    console.error('Error in FetchParseEnrich:', error);
  }

}




const SyncSave = async (parsed) => {

  try {
    // 2. Save to DB
    const dbsave = await SaveToDB(parsed); // Attempt to save to DB and save the result to dbsave
    if (!dbsave.success) { // If saving to db is unsuccessful, return the db save error message
      return dbsave;
    }
    return { success: true, msg: dbsave.msg, data: parsed }; // Return a success message with the parsed data
  } catch (error) {
    console.error('Error in SyncSave:', error);
  }
};


const DeleteAllRecords = async () => {
  const response = await DeleteAllfromDB();
  return response; // Return the response from the database deletion operation

};

const GetRecords = async () => {

  const response = await GetAllFromDB();
  return response

};

const GetFilteredRecords = async (ticker) => {

  const response = await GetFiltered(ticker);
  return response

};



module.exports = { DeleteAllRecords, GetRecords, GetFilteredRecords, HandleRet };