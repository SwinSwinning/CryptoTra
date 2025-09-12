export default function MyCard({ coin, onClick }) {
  return (
        <div 
          key={coin.id} 
          className="p-4 rounded-xl shadow bg-white"    
          onClick={onClick}    >
                  
          <h3 className="font-bold text-lg">{coin.ticker.name}</h3>
          <p className={`text-gray-700 text-xl ${coin.p1h_change > 0 ? 'text-green-600': 'text-red-600'}`}>{coin.p1h_change.toFixed(2)}%</p>
          <br></br>

          <p className="text-gray-700">{coin.price.toFixed(4)} USD</p>          
        

        </div>
  );
}