const { fetchAPIData } = require('./APIservices/kraken');
const { getFullHistoryFlags, SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered } = require('./dbservices');
const { CheckTrigger, CalculateIndicators } = require('./signalservices')
// const { ema, rsi } = require('./tahelpers')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const HandleRet = async (fullhistory) => {
  // 1. Fetching and Preprocessing for storage into db
  const preprocessed = await FetchParseEnrich(fullhistory);
  if (!preprocessed.success) {
    // throw new Error('FetchParseEnrich failed');   //throw or return?
    return preprocessed
  }
  // console.log(preprocessed.msg);

  // 2. Storing into database
  console.log("Storing into Database")
  const savedtodb = await SyncSave(preprocessed.data)
  if (!savedtodb.success) {
    return savedtodb.msg
  }

  // 3. Returning all records from Database
  const records = await GetRecords();
  if (!records.success) {
    return records.msg
  }
  return records
};

const FetchParseEnrich = async (getFullHistory) => {
  try {
    const tradingpairs = ['XBTUSDT'] //, 'ETHUSDT'];
    const parsed = []

    //const gapInSeconds = 720 * 5 * 60;
    //const fullHistoryMap = await getFullHistoryFlags(tradingpairs, gapInSeconds);

    for (const pair of tradingpairs) {
      // const fullhistory = fullHistoryMap[pair];

      // 1. Fetch external API data    
      console.log("Retrieving data for pair:", pair);
      const response = await fetchAPIData(pair);
      if (!response.success) { // If the API fetch response is unsuccessful, return the error message
        //console.log("---- > Failed retrieving data for pair:", pair);
        return {
          success: false, msg: response.msg, data: response.data
        }
      };
      const unpackedresponse = Preprocess(response, pair, getFullHistory); // prepare the data from the response for storing in the DB    
      parsed.push({ ticker: pair, data: unpackedresponse });      // Add the unpacked response to the parsed array
      console.log(`Data for ${pair} fetched successfully`)

      await sleep(800); // Sleep to avoid hitting the API rate limit
    }
    return {
      success: true, msg: "All Pairs fetched", data: parsed
    }

  } catch (error) {
    console.error('Error in FetchParseEnrich:', error);
  }

}

const Preprocess = (response, pair, getFullHistory) => {

  function Assign(candle) {
    const [timestamp, , , low, close, , volume] = candle; // assign the candle data to the variables timestamp, low, close, and volume 
    const result = {
      timestamp,
      low,
      close,
      volume
    }
    return result
  }

  function EnrichCurrentCandle(arr) { // sliced array from oldest to newest
    const currentCandle = arr[arr.length - 1];
    const periods = [1, 77, 144, 288];
   
    periods.forEach((p) => {

      if (arr.length > p) { // 4 loops
        const prev = arr[arr.length - 1 - p];
        // console.log(`${p}----- Comparing ${currentCandle.timestamp} and ${prev.timestamp}`)
        // console.log(`${p}----- Comparing ${currentCandle.close} and ${prev.close}`)

        currentCandle[`last${p}change`] = ((currentCandle.close - prev.close) / prev.close) * 100;
        // console.log(`last ${p} change: ${currentCandle[`last${p}change`]}`);
      } else {
        currentCandle[`last${p}change`] = 0;
      }
    });

    // add ta's 
    const indicators = ["ema21", "ema50", "ema200", "rsi14"];

    if (arr.length > 200) {   // Need at least 200 candles to calculate the conditions     
      const result = CalculateIndicators(arr, indicators)
      for (const key in result) {
        currentCandle[key] = result[key];
      }
    }
    else {
      for (const name of indicators) {
        currentCandle[name] = 0;
      }
    }
    return currentCandle;
  };

  try {
    const ohlcvdata = response.data.result[pair];
    //console.log(ohlcvdata.slice(ohlcvdata.length-5,ohlcvdata.length)) // Log the last 5 elements of the ohlcvdata array
    const candleArray = []
    const numCandlesForCalc = 289
    const arrtoassign = ohlcvdata.slice(0, numCandlesForCalc); // need at least 289 for all the indicators to be calculated

    // assign close, low, volume and timestamp
    for (const candle of arrtoassign) {  
         candleArray.push(Assign(candle))
    }

    // Assign the last change values and indicators to the last candle
    const enrichedArray = []
    if (!getFullHistory) {
      enrichedArray.push(EnrichCurrentCandle(candleArray.slice(0, candleArray.length)))

    } else {
      for (let i = 0; i < 20; i++) { // enrich and add to database only the last 20 candles        
        enrichedArray.push(EnrichCurrentCandle(candleArray.slice(0, candleArray.length - i))) // slice the array from the beginning to the end -i
        // console.log("enrichedArray", enrichedArray[enrichedArray.length - 1])
      
      }
    }

    return enrichedArray
  } catch (error) {
    console.error('Failed to process data:', error);
    throw new Error("Failed to process data: " + error.message);
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