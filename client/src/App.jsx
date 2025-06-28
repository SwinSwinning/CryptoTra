import { useState, useEffect } from 'react'


function App() {

  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);


  const fetchRecords = async () => {
    const res = await fetch("http://localhost:8080/ret"); // retrieve records from the server 
    const data = await res.json();
    console.log("REsponse data is ", data);
        

    if (data.success) {    
      setRecords(Object.values(data.records.data));    // Set the records state
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
        const res = await fetch("http://localhost:8080/getrecords"); // Replace with your endpoint
        const data = await res.json();
  
        setRecords(Object.values(data.data.data));
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <header className="text-center bg-amber-100">
        <h1 className="text-blue-600 mb-5">Crypto Tracker</h1>
        <div className="flex gap-4">
          <button onClick={fetchRecords} className='flex-1'>Retrieve</button><button onClick={deleteRecords} className='flex-1'>Delete</button>
        </div>
      </header>
      <div className="flex text-center ">
        <h2 className="flex-1 font-bold">ID</h2>
        <h2 className="flex-1 font-bold">Name</h2>
        <h2 className="flex-1 font-bold">Price</h2>
      </div>
      <hr className="border-amber-500" />
      <records>
        {records.length > 0 ? (
          records.map((record) => (
            <div key={record.id} className="flex text-center">
              <h2 className="flex-1">{record.id}</h2>
              <h2 className="flex-1">{record.name}</h2>
              <h2 className="flex-1">{record.price}</h2>
            </div>
          ))) : (<h2 className="text-red-500 text-center">No records found</h2>)}
      </records>
    </>
  )
}

export default App
