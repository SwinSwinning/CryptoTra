require('dotenv').config()
const {  RunTest, HandleRet, DeleteAllRecords, GetRecords, GetFilteredRecords } = require('../server/services/syncservice');
// const { SaveToDB, DeleteAllfromDB, GetAllFromDB } = require('../server/services/dbservices'); // for testing / remove after


const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

const cron = require('node-cron');

app.use(express.json());
app.use(cors());


// cron.schedule('*/5 * * * *', async () => {
// try {
//   const records = await HandleRet(false);
//   console.log('Cron job success:');
// } catch (err) {
//   console.error('Cron job failed:', err.message);
// }
// });

app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/del', async (req, res) => {
  try {
    // Delete all records from the 'candle' table
    const data = await DeleteAllRecords();
    res.json({ success: true, data })

  } catch (error) {
    console.log('Error in /del route:');
    return res.status(500).json({ success: false, msg: 'Route Error ' + error.message });
  }


});


// app.get('/test', async (req, res) => {
 
//   const candle = {
//   ticker: 'XBTUSDT',
//   data: [
//     {
//       timestamp: 1753917600,
//       low: '117517.1',
//       close: '117517.1',
//       volume: '0.00078214',
//       last1change: 0,
//       last77change: 0,
//       last144change: 0,
//       last288change: 0,
//       conditions: null
//     }
//   ]
// }
//   const result = await SaveToDB([candle]);
//   if (!result.success) {
//     return res.status(500).json({ success: false, msg: result.msg });
//   } 
//   console.log("Saved to DB successfully -- end");
//   return res.json({ success: result.success, msg: result.msg, data: result });
// });


app.get('/ret', async (req, res) => {
  // const history = req.query.history === 'true'; // Convert query parameter to boolean
  try {
    const result = await HandleRet();
    //console.log("HandleRet completed");
        if (!result.success) {       
      return res.status(500).json(result);
    }

    return res.json({ success: true, records: result });
  } catch (error) {
    console.log('Error in /ret route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
});



app.get('/getrecords', async (req, res) => {
  const ticker = req.query.ticker; // Get ticker from the query parameter 


  try {
    
    if (ticker) {
      const data = await GetFilteredRecords(ticker);
      res.json({ success: true, data })
    } else {
      const data = await GetRecords();
    
      res.json({ success: true, data })
      //console.log(data.count)
    }




  } catch (error) {
    console.log('Error in /getrecords route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });

  }
}
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
