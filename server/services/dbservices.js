const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SaveToDB = async (data) => {

  try {
    const tosave = []  
    Object.values(data).forEach(item => {   
      tosave.push({
        ticker: item.ticker,
        timestamp: item.data.timestamp,
        name: item.ticker,
        price: parseFloat(item.data.close),
        volume: parseFloat(item.data.volume)
      })
    });
    console.log(tosave)

    await prisma.candle.createMany({
      data: tosave
    })
    return { success: true, msg: "Data saved successfully to database" }

  } catch (error) {
    console.error('Failed to save data to database:', error);
    return { success: false, msg: "Failed to save data to database" + error }; // Return an error object
  
  }

};

const DeleteAllfromDB = async () => {

  try {
    await prisma.candle.deleteMany({})
    // return {success: true, msg:"Successfully Cleared the Database"} ; 

  } catch (error) {
    console.error('Error deleting data from database:', error);
    throw new Error("Failed to Delete from database " + error.message); // Return an error object
  }

};

const GetAllFromDB = async (pagenumber, maxrecords) => {


  try {
    const total_records = await prisma.candle.count(); // Get the total number of records
    candles = await prisma.candle.findMany({
       orderBy: [
        {
          timestamp: 'desc',
        }
      ]
    })

    return { success: true, msg: "All records from DB retrieved", data: candles, count: total_records }; // Return the retrieved data 

  } catch (error) {
    console.error('Error retrieving from database:', error);
    return { success: false, msg: "Failed to retrieve from database" }; // Return an error object
  }

};

const GetFiltered = async (UCID) => {
  try {
    filteredcandles = await prisma.candle.findMany({
      orderBy: [
        {
          timestamp: 'desc',
        }
      ],
      where: {
        UCID: parseInt(UCID),
      },
    })
    return { success: true, msg: "Record(s) found and returned", data: filteredcandles }; // Return the retrieved data
  } catch (error) {
    console.error('REcord not found:', error);
    return { success: false, msg: "record not found" }; // Return an error object

  }

};
module.exports = {
  SaveToDB, DeleteAllfromDB, GetAllFromDB, GetFiltered
};