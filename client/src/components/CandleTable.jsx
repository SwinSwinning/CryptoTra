    export default function CandleTable({loading, currentRecords, toggleDropdown, handleSelect, showDropdown , ClearFilter  }) {
  return (
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
  );
}
    
    
    
    