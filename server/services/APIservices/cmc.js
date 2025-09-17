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


