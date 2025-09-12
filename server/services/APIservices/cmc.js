const axios = require('axios');
require('dotenv').config();

const environments = {
  test: {
    baseUrl: 'https://sandbox-api.coinmarketcap.com/',
    apiKey: process.env.TEST_API_KEY
  },
  prod: {
    baseUrl: 'https://pro-api.coinmarketcap.com/',
    apiKey: process.env.PROD_API_KEY
  }
};

// fallback = test if NODE_ENV not set
const environment = process.env.NODE_ENV || 'test';
const config = environments[environment];
//console.log(config)
if (!config.apiKey) {
  throw new Error(`API key not set for environment: ${environment}`);
}


 const CMCfetchAPIData = async (UCIDs) => {

const parameters = {
id : UCIDs.join(',')
};
//console.log(parameters)
    const urlPath = 'v2/cryptocurrency/quotes/latest';
    const url = config.baseUrl + urlPath;
    try {
        const response = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': config.apiKey
            },
            params: parameters
        });             

         return response.data
        } catch (error){
    console.error('Error fetching data from API:', error); 
    throw new Error("Failed to fetch data from CMC API " + error.message); // Return an error object
        }
}

 const CMCGainersLosers = async (string) => {   
    const urlpath ='v1/cryptocurrency/listings/latest';
    const url = config.baseUrl + urlpath;
    console.log(url)
    const parameters = {
                limit :  200,
                sort : 'percent_change_1h',
                sort_dir : string,

};
    try {
        const response = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': config.apiKey 
            },
            params: parameters
        });        

         return response.data
        } catch (error){
    console.error('Error fetching data from API:', error); 
    throw new Error("Failed to fetch data from CMC API " + error.message); // Return an error object
        }
}


 const CMCMapAPI = async () => {   
    const urlpath ='v1/cryptocurrency/map';
    const url = config.baseUrl + urlpath;
    console.log(url)
    const parameters = {               
                sort : "id"
             

};
    try {
        const response = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': config.apiKey 
            },
            params: parameters
        });        

         return response.data
        } catch (error){
    console.error('Error fetching Map data from CMC API:', error); 
    throw new Error("Failed to fetch Map data from CMC API " + error.message); // Return an error object
        }
}



module.exports = { CMCfetchAPIData, CMCGainersLosers, CMCMapAPI};



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