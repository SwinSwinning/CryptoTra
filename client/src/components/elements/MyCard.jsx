export default function MyCard({ gainer }) {
  return (
        <div 
          key={gainer.id} 
          className="p-4 rounded-xl shadow bg-white"        >
          <h3 className="font-bold text-lg">{gainer.ticker.name}</h3>
          <p className="text-gray-700">Krakenprice {gainer.ticker.krakenCandle[0].price.toFixed(4)}</p>
          <p className="text-gray-700">CMC Price {gainer.price.toFixed(4)}</p>
          <p className="text-gray-700">1h Change: {gainer.p1h_change.toFixed(2)}%</p>
          <p className="text-gray-700">24h Change: {gainer.p24h_change.toFixed(2)}%</p>          
          <p className="text-gray-700">24h kraken Change: {gainer.ticker.krakenCandle[0].last288change.toFixed(2)}%</p>
          <p className="text-gray-700">RSI {gainer.ticker.krakenCandle[0].rsi14.toFixed(2)}</p>
        </div>
  );
}