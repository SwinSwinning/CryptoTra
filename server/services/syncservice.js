const { fetchAPIData } = require('./APIservices/kraken');
const { SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered } = require('./dbservices');
const { CheckTrigger } = require('./signalservices');

const Unpack = (response, pair) => {
  try {
    const ohlcvdata = response.data.result[pair];     
    lastEntry = ohlcvdata[[ohlcvdata.length - 2]]; // Log the last element of the ohlcvdata array

    //  [
    //   1751728500,
    //   '108178.3',
    //   '108180.5',
    //   '108154.8',
    //   '108154.8',
    //   '108160.3',
    //   '0.02453749',
    //   5
    // ]
    const [timestamp, , , low, close, , volume] = lastEntry; // Destructure the last entry to get the timestamp, low, close, and volume

    const unpacked = {
      timestamp,
      low,
      close,
      volume
    }

    
    return unpacked

  } catch (error) {
    console.error('Failed to unpack data:', error);
  }
}

const FetchAndSavetoDB = async () => {
  try {
    const tradingpairs = ['XBTUSDT', 'ETHUSDT'];
    const parsed=[]
    for (const pair of tradingpairs) {
      // 1. Fetch external API data    
      const response = await fetchAPIData(pair);
      if (!response.success) { // If the API fetch response is unsuccessful, return the error message
        return {
          success: false, msg: response.msg, data: response.data
        }
      };
      const unpackedresponse = Unpack(response, pair); // Unpack the data from the response
      // console.log(unpackedresponse);
      parsed.push({ticker: pair, data :unpackedresponse}); // Add the unpacked response to the parsed array
    }
    // console.log(parsed);

    // 2. Save to DB
    const dbsave = await SaveToDB(parsed); // Attempt to save to DB and save the result to dbsave
    if (!dbsave.success) { // If saving to db is unsuccessful, return the db save error message
      return dbsave;
    }
    return { success: true, msg: "Data fetched and saved successfully", data: parsed }; // Return a success message with the parsed data
  } catch (error) {
    console.error('Error in FetchAndSavetoDB:', error);
  }
};

// const FetchAndSavetoDB = async () => {
//   // 1. Fetch external API data  
//   const response = await fetchAPIData();

//   if (response.success) { // 2. if api fetch response is successful...
//     console.log(response.msg);

//     dbsave = await SaveToDB(response.data);  //.....attempt to save to DB and save the result to dbsave
//     console.log(dbsave.msg);
//     if (!dbsave.success) { // if saving to db is unsuccessful, return the db save error message
//       return dbsave
//     }
//   }

//   return response; // Return the fetched data or an error object

// };


const HandleRet = async () => {

  const fetchSaveRes = await FetchAndSavetoDB();
  if (!fetchSaveRes.success) {
    throw new Error('FetchAndSavetoDB failed');
  }
  console.log(fetchSaveRes.data); // Check the trigger condition using the fetched data
  // console.log(CheckTrigger(fetchSaveRes.data)); // Check the trigger condition using the fetched data
  const records = await GetRecords();
  if (!records.success) {
    throw new Error('GetRecords failed');
  }

  return records

};

const DeleteAllRecords = async () => {
  const response = await DeleteAllfromDB();
  return response; // Return the response from the database deletion operation

};

const GetRecords = async (page = 1, limit = 32) => {

  const response = await GetAllFromDB(page, limit);
  return response

};

const GetFilteredRecords = async (UCID) => {

  const response = await GetFiltered(UCID);
  return response

};

module.exports = { FetchAndSavetoDB, DeleteAllRecords, GetRecords, GetFilteredRecords, HandleRet };