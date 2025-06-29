import { useState, useEffect } from 'react'


function App() {

  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uniqueNames, setUniqueNames] = useState([]);





  const fetchRecords = async () => {
    const res = await fetch("http://localhost:8080/ret"); // retrieve records from the server 
    const data = await res.json();
    console.log("Response data is ", data);


    if (data.success) {
      const rawRecords = Object.values(data.records.data)
      setRecords(rawRecords);    // Set the records state
      setUniqueNames([...new Set(rawRecords.map((r) => r.UCID))]);
    }
    else {
      setError(data.msg);
      console.log(error)
    }
  };

  const deleteRecords = async () => {
    try {
      const res = await fetch("http://localhost:8080/del");
      const data = await res.json();

      if (data.success) {
        setRecords([]);
        setUniqueNames([]);
      }
      else {
        setError(data.msg || "Failed to delete records");
        console.log(error)
      }

    } catch (error) {
      console.log(" Error Frontend " + error.message);   // ****Is this catch block necessary?****
    }

  };

  useEffect(() => {
    async function fetchData() {
      try {

        const res = await fetch("http://localhost:8080/getrecords");
        const data = await res.json();
    

        const rawRecords = Object.values(data.data.data)
        setRecords(rawRecords);
        setUniqueNames([...new Set(rawRecords.map((r) => r.UCID))]);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchData();
  }, []);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleSelect = async (ucid) => {
    setShowDropdown(false);
    try {
      const res = await fetch(`http://localhost:8080/getrecords?UCID=${encodeURIComponent(ucid)}`);
      const data = await res.json();
      const rawRecords = Object.values(data.data.data)

      setRecords(rawRecords);

    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

      const ClearFilter = async () => {
    setShowDropdown(false); 
    try {
      const res = await fetch(`http://localhost:8080/getrecords`);
      const data = await res.json();
      
      const rawRecords = Object.values(data.data.data)
      setRecords(rawRecords);
     
    } catch (error) {
      console.error("Error Clearing Filter" );
    }
  };



  return (
    <>
      <header className="text-center bg-amber-100">
        <h1 className="text-blue-600 mb-5">Crypto Tracker</h1>
        <div className="flex gap-4">
          <button onClick={fetchRecords} className='flex-1'>Retrieve</button><button onClick={deleteRecords} className='flex-1'>Delete</button>
        </div>

      </header>
      <div className="flex text-center ">
        <h2 className="flex-0.5 font-bold">ID</h2>
        <h2 className="flex-1 font-bold">Timestamp</h2>


        <div className="flex-1 relative inline-block border-2">
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
        </div>


        <h2 className="flex-1 font-bold">Name</h2>
        <h2 className="flex-1 font-bold">Price</h2>
      </div>
      <hr className="border-amber-500" />
      <records>
        {records.length > 0 ? (
          records.map((record) => (
            <div key={record.id} className="flex text-center">

              <h2 className="flex-0.5">{record.id}</h2>
              <h2 className="flex-1">{record.timestamp}</h2>
              <h2 className="flex-1">{record.UCID}</h2>
              <h2 className="flex-1">{record.name}</h2>
              <h2 className="flex-1">{record.price}</h2>
            </div>
          ))) : (<h2 className="text-red-500 text-center">No records found</h2>)}
      </records>
    </>
  )
}

export default App
