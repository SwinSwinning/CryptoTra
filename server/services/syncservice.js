const { fetchAPIData } = require('./cmc');
const { SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered } = require('./dbservices');

const FetchAndSavetoDB = async () => {
  // 1. Fetch external API data  
  const response = await fetchAPIData();
  // console.log(response.data.status.timestamp);
  console.log(response.msg)
  if (response.success) { // 2. if api fetch response is successful...
    

    dbsave = await SaveToDB(response.data);  //.....attempt to save to DB and save the result to dbsave
    console.log(dbsave.msg);
    if (!dbsave.success) { // if saving to db is unsuccessful, return the db save error message
      return dbsave
      
    }
  }
 

  return response; // Return the fetched data or an error object

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

const DeleteAllRecords = async () => {
  const response = await DeleteAllfromDB();
  return response; // Return the response from the database deletion operation

};

const GetRecords = async (page=1,limit=32 ) => {

  const response = await GetAllFromDB(page, limit);    
  return response

};

const GetFilteredRecords = async (UCID) => {

  const response = await GetFiltered(UCID);    
  return response

};

module.exports = { FetchAndSavetoDB, DeleteAllRecords, GetRecords, GetFilteredRecords };