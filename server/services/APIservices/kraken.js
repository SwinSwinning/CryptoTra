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

        return response
    } catch (error) {
        throw new Error("Failed retrieve data from API " + error.message);
    }
}

// const fetchAPIData = async (pair) => {
//     const parameters = {
//         interval: 5,
//         pair: pair,

//     };
//     try {
//         const response = await axios.get(url, {
//             params: parameters
//         });

//         return { success: true, msg: `Successfully fetched ${pair} data from API:`, data: response.data }; // Return the fetched data  
//     } catch (error) {     
//         return { success: false, msg: `Error fetching ${pair} data from API:`, data: error}; // Return an error object   
//     }
// }

module.exports = { fetchAPIData };


