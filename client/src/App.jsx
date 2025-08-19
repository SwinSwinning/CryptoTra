import { useState, useEffect } from 'react'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {

  const [allRecords, setAllRecords] = useState([]);
  const [currentRecords, setCurrentRecords] = useState([]);  // <---- Start here
  const [error, setError] = useState(null); // State to hold error messages
  const [showDropdown, setShowDropdown] = useState(false);
  const [uniqueNames, setUniqueNames] = useState([]);

  const [totalRecordCount, setTotalRecordCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
    const res = await fetch(`http://localhost:8080/getrecords`);
    const data = await res.json();

    
    const rawRecords = Object.values(data.data.data)
    setAllRecords(rawRecords)
    // setFilteredRecords(rawRecords)
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
  // This runs every time `records` changes
  RefreshUI();
}, [allRecords]);



  const fetchRecords = async () => {
    console.log(allRecords.length > 0 ? "Fetching new records" : "Fetching records for the first time"); // add ticker condition also
    const last20 = allRecords.length == 0; // add ticker condition also

    const res = await fetch(`http://localhost:8080/ret?history=${last20}`); // retrieve new records from the server   Dont need to specify last20
    const data = await res.json();

    if (data.success) {
      const rawRecords = Object.values(data.records.data)
      console.log(rawRecords)
      setAllRecords(rawRecords);    // Set the records state
      setUniqueNames([...new Set(rawRecords.map((r) => r.ticker))]);       // use refreshui here??!?!?!
     RefreshUI()
      toast.success("Records retrieved successfully");
    }
    else {
      setError(data.msg);
      toast.error(data.msg || "Failed to download new records");
      console.log(error)
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
        setError(data.msg || "Failed to delete records");
        toast.error(data.msg || "Failed to delete records");
        console.log(error)
      }

    } catch (error) {
      console.log(" Error Frontend " + error.message);   // ****Is this catch block necessary?****
      toast.error(data.msg || "Failed to delete records");
    }

  };

  const ShowRecords = () => {
    console.log(records);

  };



  const toggleDropdown = () => {
    console.log("toggleDropdown called");

    setShowDropdown((prev) => !prev);
  };

  const handleSelect = async (ticker) => {
    setShowDropdown(false);
    try {
      const res = await fetch(`http://localhost:8080/getrecords?ticker=${encodeURIComponent(ticker)}`); //Can I use the records state here to not have to fetch again?
      const data = await res.json();
      console.log("data", data)
      const rawRecords = Object.values(data.data.data)

      setAllRecords(rawRecords);

    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  const ClearFilter = async () => {     // remove async?
    setShowDropdown(false);
    try {
      setCurrentRecords(allRecords)
      
      RefreshUI();

    } catch (error) {
      console.error("Error Clearing Filter");  // Is this one necesary?
    }
  };


    const RefreshUI = async () => {         // remove Async ? 
    
    console.log("unique names: ", uniqueNames.length)  
    setCurrentRecords(allRecords)  

    // setUniqueNames([...new Set(records.map((r) => r.ticker))]);  
 
    setTotalRecordCount(allRecords.length); // Set the total record count
    
  }

  // const RefreshUI = async () => {
  //   const res = await fetch(`http://localhost:8080/getrecords`);
  //   const data = await res.json();
  //   console.log(uniqueNames)
    
  //   const rawRecords = Object.values(data.data.data)
  //   // console.log("rawRecords", rawRecords)
  //   setUniqueNames([...new Set(rawRecords.map((r) => r.ticker))]);
    
  //   //setRecords(rawRecords);
  //   setTotalRecordCount(rawRecords.length); // Set the total record count
    
// }



  return (
    <div>
      <header className="text-center bg-gray-100 p-3">
        <h1 className="text-indigo-600 mb-5">Crypto Tracker</h1>
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




      <div className="w-full">
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
            {currentRecords.length > 0 ? (
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

        {/* <div className="flex-1 relative inline-block border-2">
          <div onClick={toggleDropdown} className=" font-bold cursor-pointer">
            UCID
          </div>

          {showDropdown && (
            <ul className="absolute left-0 top-full border mt-1 w-48 bg-white shadow-md z-10">
              <li className='p-2 hover:bg-gray-100' onClick={() => ClearFilter()} >Clear Filter</li>
              {uniqueNames.map((UCID) => (
                <li key={UCID}
                  onClick={() => handleSelect(UCID)}
                  className="p-2 hover:bg-gray-100">
                  {UCID}
                </li>
              ))}
            </ul>
          )}
        </div> */}


        {/* <nav aria-label="Page navigation example">
        <ul class="inline-flex -space-x-px text-base h-10">
          <li>
            <a href="#" class="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Previous</a>
          </li>

          <li>
            <a href="#" aria-current="page" class="flex items-center justify-center px-4 h-10 text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white">{currentPage}</a>
          </li>

          <li>
            <a onClick={NextPaginate} class="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Next</a>
          </li>
        </ul>
      </nav> */}
      </div>
      <div className='footer'> Placeholder for footer
        <div className="flex gap-4">
          <button onClick={ShowRecords} className='flex-1'>Show FE records</button>
        </div>
      </div>
    </div>
  )
}

export default App
