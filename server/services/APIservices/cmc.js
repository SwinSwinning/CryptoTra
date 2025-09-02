const axios = require('axios');
require('dotenv').config(); 

const environment = process.env.NODE_ENV || 'test';

// Define configurations for test and production
const config = {
    test: {
        url: 'https://sandbox-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest',
        apiKey: process.env.TEST_API_KEY
    },
    prod: {
        url: 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest',
        apiKey: process.env.PROD_API_KEY
    }
};

// Use the appropriate configuration
const { url, apiKey } = config[environment];
const UCIDs = '1,2,52' //,74,328,512,1027,1765,1831,1839,1958,1975,2010,2280,3513,3773,4030,4642,5426,5805,5994,6210,6538,6636,7080' +
            // ',7083,7278,8425,11840,11841,13502,13855,20947,21794,22861,23095,24478,25028,28782,30171,33788,34466,' +
            // '18876,3794,2011,24911,1765,11419,8000,28324,5007,29814,2416,6758,32698,8916,14806,9481,4157,1437,29210,4944,' +
            //  '28850,1518,28321,6783,3964,1966,4066,4558,28541,32195,18069,28301,6719,32461,29587,5034,5692,23121,' +
            //   '5864,8104,2586,3945,5964,2469,20314,7653,5117,2130,28846,3783,4846,7501,7150,1934,28674,28299,9444,5728'

const parameters = {
id :  UCIDs,
convert_id: 825
};



 const CMCfetchAPIData = async () => {
    try {
        const response = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey
            },
            params: parameters
        });             

         return response.data
        } catch (error){
    console.error('Error fetching data from API:', error); 
    throw new Error("Failed to fetch data from CMC API " + error.message); // Return an error object
        }
}

 const CMCGainersLosers = async () => {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=200', {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey
            },
            params: parameters
        });        

         return response.data
        } catch (error){
    console.error('Error fetching data from API:', error); 
    throw new Error("Failed to fetch data from CMC API " + error.message); // Return an error object
        }
}

// const KrakenfetchAPIData = async (pair) => {
//     const parameters = {
//         interval: 5,
//         pair: pair,

//     };
//     try {
//         const response = await axios.get(url, {
//             params: parameters
//         });

//         return response
//     } catch (error) {
//         throw new Error("Failed retrieve data from API " + error.message);
//     }
// }


module.exports = { CMCfetchAPIData, CMCGainersLosers};



// const Unpack = (data) => {
//   try {
    
//     const tosave = []
//     const records = data.data
//     const timestamp = data.status.timestamp; // Get the timestamp from the data
//     // console.log(records)
//     Object.values(records).forEach(item => {
//       console.log(item.id, item.name, item.symbol, item.quote["825"]);
//       tosave.push({
//         UCID: item.id,
//         timestamp: timestamp,
//         name: item.name,
//         symbol: item.symbol,
//         price: item.quote["825"].price,
//         percent_change_24h: item.quote["825"].percent_change_24h
//       })
     
//     });
//     // console.log(tosave)
//   } catch (error) {
    
//   }
// }