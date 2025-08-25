import { useState, useEffect } from 'react'
import Logo from './assets/FCmFwG01currentColor.svg';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  const [loading, setLoading] = useState(false)
  const [allRecords, setAllRecords] = useState([]);
  const [currentRecords, setCurrentRecords] = useState([]);
  // const [error, setError] = useState(null); // State to hold error messages
  const [showDropdown, setShowDropdown] = useState(false);
  const [uniqueNames, setUniqueNames] = useState([]);

  const [totalRecordCount, setTotalRecordCount] = useState(0);

  useEffect(() => {  // Retrieve all records from DB on page load.
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:8080/getrecords`);
        const data = await res.json();
        console.log("Data: ", data)

        const rawRecords = Object.values(data.data)
        SetStates(rawRecords)


      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchData();
  }, []);


  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:8080/ret`); // retrieve new records calling the Kraken API
      const data = await res.json();

      if (!data.success) {
        // setError(data.msg);
        toast.error(data.msg || "Failed to download new records");
        console.log(data.msg)
      }

        const rawRecords = Object.values(data.records)
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


  const SetStates = (rawRecords, tofilter = false) => {
    const topRecordsPerTicker = {};
    const uniqueNamesSet = new Set();

    for (const rec of rawRecords) {
      uniqueNamesSet.add(rec.ticker);

      if (!topRecordsPerTicker[rec.ticker]) {
        topRecordsPerTicker[rec.ticker] = [];
      }


      const arr = topRecordsPerTicker[rec.ticker];
      arr.push(rec);
      arr.sort((a, b) => b.timestamp - a.timestamp); // newest first
      if (arr.length > 5) arr.pop(); // keep only 5
    }

    // flatten all tickers into one array
    const limited = Object.values(topRecordsPerTicker).flat();

    // final sort across all tickers
    limited.sort((a, b) => b.timestamp - a.timestamp);

    if (!tofilter) {
      setAllRecords(rawRecords)
      setUniqueNames([...uniqueNamesSet]);
      setTotalRecordCount(rawRecords.length);
    }

    setCurrentRecords(limited);


  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="text-center bg-gray-100 p-3">
        <h1 className="text-indigo-500 mb-5">Crypto Tracker</h1>
        <div className="flex gap-4">
          <button onClick={() => fetchRecords()} className='flex-1'>Retrieve Records</button>

          <button onClick={deleteRecords} className='flex-1'>Delete</button>
        </div>

      </header>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={true}

      />

      <div className="w-full flex-grow">
        <table className="w-full divide-y-2 divide-gray-200 table-fixed">
          <thead className="table-header">
            <tr className='space-between'>
              <th className="table-cell w-2/16">Timestamp</th>
              <th className="px-4 py-1 text-left relative cursor-pointer w-2/16"><div onClick={toggleDropdown}>Ticker▼</div>
                {showDropdown && (
                  <ul className="absolute left-0 top-full border mt-1 w-48 bg-white shadow-md z-10">
                    <li className='p-2 hover:bg-gray-100' onClick={() => ClearFilter()} >Clear Filter</li>
                    {uniqueNames.map((ticker) => (
                      <li key={ticker}
                        onClick={() => handleSelect(ticker)}
                        className="p-2 hover:bg-gray-100">
                        {ticker}
                      </li>
                    ))}
                  </ul>
                )}</th>
              <th className="table-cell w-2/16">Name</th>
              <th className="table-cell w-2/16">Price</th>
              <th className="table-cell w-2/16">% change (1)</th>
              <th className="table-cell w-2/16">% change (77)</th>
              <th className="table-cell w-2/16">% change (144)</th>
              <th className="table-cell w-2/16">% change (288)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">


            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="flex justify-center items-center">
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
                </td>
              </tr>
            ) :

              currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td className="table-cell">{record.timestamp}</td>
                    <td className="table-cell">{record.ticker}</td>
                    <td className="table-cell">{record.name}</td>
                    <td className="table-cell">{record.price}</td>
                    <td className="table-cell">{Number(record.last1change).toFixed(2)}</td>
                    <td className="table-cell">{Number(record.last77change).toFixed(2)}</td>
                    <td className="table-cell">{Number(record.last144change).toFixed(2)}</td>
                    <td className="table-cell">{Number(record.last288change).toFixed(2)}</td>
                  </tr>
                ))) : (
                <tr>
                  <td colSpan="5" className="text-red-500 text-center px-4 py-2">
                    No records found
                  </td>
                </tr>
              )}
          </tbody>
        </table>



      </div>
      <div className='footer text-white flex items-center justify-center bg-indigo-500 min-h-20'>
        <div className="flex items-center gap-20">
          <p>Link to Github</p>
          <img src={Logo} alt="Logo" className="h-15 w-15" />

          <p>All rights reseverd</p>
        </div>
      </div>
    </div>
  )
}

export default App
