require('dotenv').config()
const { FetchAndSavetoDB, DeleteAllRecords, GetRecords, GetFilteredRecords } = require('../server/services/syncservice');


const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


app.use(express.json());
app.use(cors());

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


app.get('/ret', async (req, res) => {
  try {
    const fetchSaveRes = await FetchAndSavetoDB();


    if (!fetchSaveRes.success) {
      console.log("fetchSaveRes success is false")
      console.log(fetchSaveRes)
      return res.status(500).json(fetchSaveRes);
    }

    const records = await GetRecords();
    if (!records.success) {
      console.log("records success is false")
      console.log(records)
      return res.status(500).json(records);
    }
    console.log(res)
    res.json({ success: true, records })
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Rrrroute Errorrrrrrr ' + error.message });
  }

});



app.get('/getrecords', async (req, res) => {
  const ucid = req.query.UCID; // Get UCID from the query parameter 

  // console.log("index ->   get records:" + ucid);
  try {
    
    if (ucid) {
      const data = await GetFilteredRecords(ucid);
      res.json({ success: true, data })
    } else {
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
