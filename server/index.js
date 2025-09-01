require('dotenv').config()
const {  HandleRet, DeleteAllRecords, GetRecords} = require('./services/syncservice');



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
    return res.json({ success: true, records: result });
  } catch (error) {
    console.log('Error in /ret route:' + error.message);
    return res.status(500).json({ success: false, msg: error.message });
  }
});



app.get('/getrecords', async (req, res) => {
  const ticker = req.query.ticker; // Get ticker from the query parameter 


  try {    
    if (ticker) { // If there is a ticker, filter the records based on ticker..
      const data = await GetRecords(ticker);
      res.json({ success: true, data })
    } else { // .. otherwise get all the records
      const data = await GetRecords();    
      res.json({ success: true, data })
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
