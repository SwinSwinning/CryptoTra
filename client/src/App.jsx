import { useState, useEffect } from 'react'
import Logo from './assets/FCmFwG01currentColor.svg';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import CandleTable from "./components/CandleTable";
import TopCoinsElement from './components/TopCoinsElement';
import CoinDetails from "./components/CoinDetails";


function App() {
  const [loading, setLoading] = useState(false)
  const [allRecords, setAllRecords] = useState([]);
  const [currentRecords, setCurrentRecords] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  // const [error, setError] = useState(null); // State to hold error messages
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false);
  const [uniqueNames, setUniqueNames] = useState([]);

  const [totalRecordCount, setTotalRecordCount] = useState(0);

  useEffect(() => {  // Retrieve all records from DB on page load.
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:8080/getrecords`);
        const data = await res.json();

        SetStates(data.data)

      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }
    fetchData();
  }, []);


  const updateAvailablePairs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:8080/tic`); // retrieve new records calling the Kraken API
      const data = await res.json();

      if (!data.success) {
        toast.error(data.msg || "Failed to download available pairs");
        console.log(data.msg)
      }

      toast.success("Available tickers updated");

    } catch (err) {
      console.error("avalable tickers Update failed:", err);
      toast.error("Network or server error while fetching records");

    } finally {
      setLoading(false)
    }
  }

  const updateTrending = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:8080/upd`); // retrieve new records calling the Kraken API
      const data = await res.json();


      if (!data.success) {

        toast.error(data.msg || "Failed to download trending records");
        console.log(data.msg)
      }

      SetStates(data.data)

      toast.success("Trending Updated");

    } catch (err) {
      console.error("Trend Update failed:", err);
      toast.error("Network or server error while fetching records");

    } finally {
      setLoading(false)
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:8080/ret`); // retrieve new records calling the Kraken API
      const data = await res.json();
      console.log("Data: ", data)
      if (!data.success) {
        // setError(data.msg);
        toast.error(data.msg || "Failed to download new records");
        console.log(data.msg)
      }


      const rawRecords = Object.values(data.records.all)

      //console.log(rawRecords)
      SetStates(rawRecords)
      toast.success("Records retrieved successfully");

    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error("Network or server error while fetching records");

    } finally {
      setLoading(false)
    }


  };

  const deleteRecords = async () => {
    try {
      const res = await fetch("http://localhost:8080/del");
      const data = await res.json();


      if (data.success) {
        setAllRecords([]);
        setCurrentRecords([])
        setUniqueNames([]);
        toast.success("Records deleted successfully");
      }
      else {
        // setError(data.msg || "Failed to delete records");
        toast.error(data.msg || "Failed to delete records");
        console.log(data.msg)
      }

    } catch (error) {
      console.log(" Error Frontend " + error.message);   // ****Is this catch block necessary?****
      toast.error(data.msg || "Failed to delete records");
    }

  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleSelect = (ticker) => {
    setShowDropdown(false);
    const tofilter = true
    const filteredRecords = allRecords.filter(r => r.ticker === ticker);
    SetStates(filteredRecords, tofilter);

  }

  const ClearFilter = () => {
    setShowDropdown(false);
    SetStates(allRecords)
  };


  const SetStates = (data, tofilter = false) => {

    const topRecordsPerTicker = {};
    const uniqueNamesSet = new Set();
 
    for (const rec of data.records) {
      uniqueNamesSet.add(rec.ticker);

      if (!topRecordsPerTicker[rec.ticker]) {
        topRecordsPerTicker[rec.ticker] = [];
      }


      const arr = topRecordsPerTicker[rec.ticker];
      arr.push(rec);
      arr.sort((a, b) => b.timestamp - a.timestamp); // newest first
      if (arr.length > 10) arr.pop(); // keep only 10 max
    }

    // flatten all tickers into one array
    const limited = Object.values(topRecordsPerTicker).flat();
    const topGrecords = Object.values(data.toprecords)
    const topLrecords = Object.values(data.botrecords)
    // final sort across all tickers
    limited.sort((a, b) => b.timestamp - a.timestamp);

    // console.log(topGrecords)
    if (!tofilter) {
      setTopGainers(topGrecords.slice(0, Math.min(3, topGrecords.length)))
      setTopLosers(topLrecords.slice(0, Math.min(3, topLrecords.length)))

      setAllRecords(data.records)
      setUniqueNames([...uniqueNamesSet]);
      setTotalRecordCount(data.records.length);
    }

    setCurrentRecords(limited);


  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="text-center bg-gray-100 p-3">
        <h1 className="text-indigo-500 mb-5">Crypto Tracker</h1>
        <div className="flex gap-4">
          <button onClick={() => updateTrending()} className='flex-1'>Update Gainers & Losers</button>
          <button onClick={() => updateAvailablePairs()} className='flex-1'>Update Available Crypto pairs</button>
        </div>
      </header>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={true}
      />


      {loading ? (

        <div className="flex flex-col items-center justify-center w-full py-4">
          <div className="flex items-center">
            <svg
              className="animate-spin h-10 w-10 mr-3 text-indigo-500"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
              />
            </svg>
            <span>Fetching...</span>
          </div>
        </div>
      ) :

        selectedCoin ? (
          <CoinDetails coin={selectedCoin} onBack={() => setSelectedCoin(null)} />
        ) : (<div>
          <TopCoinsElement TopCoins={topGainers} string="Gainers" onSelect={setSelectedCoin} />
          
          <TopCoinsElement TopCoins={topLosers} string="Losers" onSelect={setSelectedCoin} />
        </div>
        )}







      {/* <CandleTable loading={loading} currentRecords={currentRecords} /> */}

      <div className='footer text-white flex items-center justify-center bg-indigo-500 min-h-20 mt-auto'>
        <div className="flex items-center gap-20">
              <a href="https://github.com/SwinSwinning/CryptoTra" target="_blank" rel="noopener noreferrer">
      Github
    </a>
          <img src={Logo} alt="Logo" className="h-15 w-15" />

          <p>All rights reserved</p>
        </div>
      </div>
    </div>
  )
}

export default App
