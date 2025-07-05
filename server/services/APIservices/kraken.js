const axios = require('axios');

const url = "https://api.kraken.com/0/public/OHLC"

const fetchAPIData = async (pair) => {
    const parameters = {
        interval: 5,
        pair: pair,
      
    };
    try {
        const response = await axios.get(url, {
            params: parameters
        });

        return { success: true, msg: "Successfully fetched from API", data: response.data }; // Return the fetched data  
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return { success: false, msg: "Failed to fetch data from API" }; // Return an error object   
    }
}

module.exports = { fetchAPIData };


