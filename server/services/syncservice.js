const { fetchAPIData } = require('./APIservices/kraken');
const { SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered } = require('./dbservices');
const { createCalculateIndicators, CheckTrigger, updateAvgVolume } = require('./signalservices')
// const { ema, rsi } = require('./tahelpers')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const HandleRet_old = async () => {
  // 1. Fetching and Preprocessing for storage into db
  const preprocessed = await FetchParseEnrich();
  if (!preprocessed.success) {
    // throw new Error('FetchParseEnrich failed');   //throw or return?
    return preprocessed
  }

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

const HandleRet = async () => {
  // 1. Fetching and Preprocessing for storage into db
  const tradingpairs = ['XBTUSDT'] //, 'ETHUSDT'];
  const response = await Fetch(tradingpairs);
  if (!response.success) {
    return response
  }


  const preprocessed = []
  for (const pair of response.data) {
    // 2. Preprocess the response  
    preprocessed.push(PreprocessPairResponseData(pair)); // prepare the data from the response for storing in the DB   
    console.log(`Data for ${pair.ticker} Preprocessed successfully`)

    // 3 Check triggers for latest candle of each pair
    const trigger = CheckTrigger(preprocessed[0]);
    if (trigger) {
      console.log("Hi")
    }
  }





  // 3. Storing into database
  console.log("Storing into Database")
  const savedtodb = await SyncSave(preprocessed)
  if (!savedtodb.success) {
    return savedtodb.msg
  }
  console.log("Successfully saved to Database")

  // 4. Returning all records from Database
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


const FetchParseEnrich_old = async () => {
  try {
    const tradingpairs = ['XBTUSDT'] //, 'ETHUSDT'];
    const parsed = []

    for (const pair of tradingpairs) {

      // 1. Fetch external API data    
      console.log("Retrieving data for pair:", pair);
      const response = await fetchAPIData(pair);
      if (!response.success) { // If the API fetch response is unsuccessful, return the error message
        //console.log("---- > Failed retrieving data for pair:", pair);
        return {
          success: false, msg: response.msg, data: response.data
        }
      };
      const unpackedresponse = Preprocess(response, pair); // prepare the data from the response for storing in the DB    
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

const PreprocessPairResponseData = (response) => {

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

  function EnrichCurrentCandle(arr) { // sliced array from oldest to newest 20 candles
    const currentCandle = arr[arr.length - 1];
    //console.log("Enriching current candle", currentCandle.timestamp)

    const periods = [1, 77, 144, 288];

    periods.forEach((p) => {

      if (arr.length > p) { // 4 loops
        const prev = arr[arr.length - 1 - p];
        //console.log(`${p}----- Comparing ${currentCandle.timestamp} and ${prev.timestamp}`)
        //console.log(`${p}----- Comparing ${currentCandle.close} and ${prev.close}`)

        currentCandle[`last${p}change`] = ((currentCandle.close - prev.close) / prev.close) * 100;
        //console.log(`last ${p} change: ${currentCandle[`last${p}change`]}`);
      } else {
        currentCandle[`last${p}change`] = 0;
      }
    });
    return currentCandle;
  };

  try {

    //console.log(response.data.data.result[response.ticker])
    const ohlcvdata = response.data.data.result[response.ticker];
    // console.log(ohlcvdata.slice(ohlcvdata.length-5,ohlcvdata.length)) // Log the last 5 elements of the ohlcvdata array

    const numCandlesForCalc = 289 // Need at least 289 candles to calculate all the indicators
    const arrtoassign = ohlcvdata.slice(ohlcvdata.length - numCandlesForCalc, ohlcvdata.length); // need at least 289 for all the indicators to be calculated

    // assign close, low, volume and timestamp
    const candleArray = []
    for (const data of arrtoassign) {
      candleArray.push(Assign(data))
    }

    const candleTa = []
    // Calculate ta's for most recent 289 candles
    const indicators = ["ema21", "ema50", "ema200", "rsi14"];
    const calcIndicators = createCalculateIndicators(indicators);
    for (const candle of candleArray) {
      const result = calcIndicators(candle);
      //Averages
      
      // console.log(`Volume: ${candle.volume}, Avg Volume: ${last100volavg}`); // Log the volume and average volume
      result.last100volavg = updateAvgVolume(candle.volume);; // Add the average volume to the result
      candleTa.push(result);

    }



    const enrichedArray = []
    for (let i = 0; i < 20; i++) { // enrich and add to database only the last 20 candles
      const enrichedCandle = { ...EnrichCurrentCandle(candleArray.slice(0, candleArray.length - i)), ...candleTa[candleTa.length - 1 - i] };
      enrichedArray.push(enrichedCandle) 

    }

    return {
      ticker: response.ticker, data: enrichedArray
    }
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