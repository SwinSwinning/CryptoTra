require('dotenv').config()
const {  UpdateGainersLosers, HandleRet, DeleteAllRecords, GetRecords, FetchAvailableTickers} = require('./services/syncservice');
const { SaveKrakenToDB, DeleteAllfromDB, GetCandlesDB, SaveTickerDB, GetTickersDB, SaveLatestCMCDB, GetTopDB, SaveTopDB } = require('./services/dbservices');

// const { CMCfetchAPIData, CMCGainersLosers } = require('./services/APIservices/cmc');
// const { MergeAPICandleData } = require('./services/synchelpers');



const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

const cron = require('node-cron');

app.use(express.json());
app.use(cors());


cron.schedule('*/15 * * * *', async () => {
try {
  const records = await UpdateGainersLosers();
  console.log('Cron job success:');
} catch (err) {
  console.error('Cron job failed:', err.message);
}
});

app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/del', async (req, res) => {   
  try {    
    const data = await DeleteAllRecords();   // Delete all records from the 'candle' table
    res.json({ success: true, data })

  } catch (error) {
    console.log('Error in /del route:');
    return res.status(500).json({ success: false, msg: 'Route Error ' + error.message });
  }


});

app.get('/ret', async (req, res) => {

  try {
    const result = await HandleRet(); 

    return res.json({ success: true, records: result  });

  } catch (error) {
    console.log('Error in /ret route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
});

// This is run ever 30 minutes or hour  3 credits 
app.get('/upd', async (req, res) => {  
  try {
    const result = await UpdateGainersLosers();  
    return res.json({ success: true, data: result  });

  } catch (error) {
    console.log('Error in /upd route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }

});

app.get('/getrecords', async (req, res) => {
  const ticker = req.query.ticker; // Get ticker from the query parameter 
  try {    
    let result = null
        if (ticker) { // If there is a ticker, filter the records based on ticker..
       result = await GetRecords(ticker);      
    } else { // .. otherwise get all the records
       result = await GetRecords();    
    }    
     res.json({ success: true, data: result })
  } catch (error) {
    console.log('Error in /getrecords route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });

  }
}
);

 // this is run once ever week or so   1 credit
app.get('/tic', async (req, res) => {

  try {
    const result = await FetchAvailableTickers();
    return res.json({ success: true, records: result });
  } catch (error) {
    console.log('Error in tic route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
});

app.get('/test', async (req, res) => {

  try {
    
    const toprecords = await GetTopDB("gainers"); // get highest gainers from cmc latest
    return res.json({ success: true, records: toprecords });
  } catch (error) {
    console.log('Error in /test route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
});

app.listen(port, '0.0.0.0',  () => {
  console.log(`Server running on http://localhost:${port}`);
});
