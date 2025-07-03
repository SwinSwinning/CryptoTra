const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SaveToDB = async (data) => {

  try {
    const tosave = []
    const records = data.data
    const timestamp = data.status.timestamp; // Get the timestamp from the data
    // console.log(records)
    Object.values(records).forEach(item => {
      // console.log(item.id, item.name, item.symbol, item.quote["825"].price, item.quote["825"].percent_change_24h);
      tosave.push({
        UCID: item.id,
        timestamp : timestamp,
        name: item.name,
        symbol: item.symbol,
        price: item.quote["825"].price,
        percent_change_24h: item.quote["825"].percent_change_24h
      })
    });
    // console.log(tosave)

    await prisma.candle.createMany({
      data: tosave
    })
    return {success: true, msg: "Data saved successfully to database"}
  } catch (error) {
    console.error('Failed to save data to database:', error);
    return {success: false, msg:"Failed to save data to database" + error} ; // Return an error object
  }

};

const DeleteAllfromDB = async () => {

  try {
    await prisma.candle.deleteMany({})
    // return {success: true, msg:"Successfully Cleared the Database"} ; 

  } catch (error) {
    console.error('Error deleting data from database:', error);
    throw new Error("Failed to Delete from database "+ error.message) ; // Return an error object
  }

};

const GetAllFromDB = async (pagenumber, maxrecords) => {


  try {
    const total_records = await prisma.candle.count(); // Get the total number of records
    candles = await prisma.candle.findMany({
      // skip: (pagenumber - 1) * maxrecords,
      // take: maxrecords,
    })
    
    return {success: true, msg:"All records from DB retrieved", data: candles,  count: total_records} ; // Return the retrieved data 

  } catch (error) {
    console.error('Error retrieving from database:', error);
    return {success: false, msg:"Failed to retrieve from database"} ; // Return an error object
  }

};

const GetFiltered = async (UCID) => { 
  try {
      filteredcandles = await prisma.candle.findMany({
  where: {
    UCID: parseInt(UCID),
  },
})
return {success: true, msg:"Record(s) found and returned", data: filteredcandles} ; // Return the retrieved data
  } catch (error) {
    console.error('REcord not found:', error);
    return {success: false, msg:"record not found"} ; // Return an error object
    
  }

};
module.exports = {
  SaveToDB,  DeleteAllfromDB, GetAllFromDB, GetFiltered
};