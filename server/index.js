require('dotenv').config()
const { FetchAndSavetoDB, HandleRet, DeleteAllRecords, GetRecords, GetFilteredRecords } = require('../server/services/syncservice');




const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

const cron = require('node-cron');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


app.use(express.json());
app.use(cors());


// cron.schedule('*/10 * * * *', async () => {
// try {
//   const records = await HandleRet();
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


app.get('/test', async (req, res) => {
  const result = await FetchAndSavetoDB();
  res.json({ success: true, msg: 'Test route is working', data: result });

});

app.get('/ret', async (req, res) => {
  try {
    const result = await HandleRet();
        if (!result.success) {         
   
      return res.status(500).json(result);

    }

    res.json({ success: true, records: result });
  } catch (error) {
    return res.status(500).json(result);    
  }

  // try {
  //   const fetchSaveRes = await FetchAndSavetoDB();
  //   if (!fetchSaveRes.success) {
  //     console.log("fetchSaveRes success is false")
  //     console.log(fetchSaveRes)
  //     return res.status(500).json(fetchSaveRes);
  //   }

  //   const records = await GetRecords();
  //   if (!records.success) {
  //     console.log("records success is false")
  //     console.log(records)
  //     return res.status(500).json(records);
  //   }

  //  console.log(records)
  //   res.json({ success: true, records })
  // } catch (error) {
  //   res.status(500).json({ success: false, msg: 'Rrrroute Errorrrrrrr ' + error.message });
  // }
});



app.get('/getrecords', async (req, res) => {
  const ucid = req.query.UCID; // Get UCID from the query parameter 
  const pagenumber = req.query.page
  // console.log("index ->   get records:" + ucid);
  try {
    
    if (ucid) {
      const data = await GetFilteredRecords(ucid);
      res.json({ success: true, data })
    } else {
      const data = await GetRecords();
    
      res.json({ success: true, data })
      console.log(data.count)
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
