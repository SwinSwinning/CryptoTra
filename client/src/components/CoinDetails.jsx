export default function CoinDetails({ coin, onBack }) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 px-3 py-1 bg-gray-200 rounded">
        ← Back
      </button>
      <h2 className="text-xl font-bold">{coin.ticker.name}</h2>
      <p
  className="text-blue-500 cursor-pointer hover:underline"
  onClick={() =>
    window.open(
      `https://coinmarketcap.com/currencies/${coin.ticker.name}`,
      "_blank"
    )
  }
>
  {coin.ticker.cmcticker}
</p>
      <br/>
      <p>Price: {coin.price}</p>
      <p>1h Change: {coin.p1h_change}%</p>
      <p>24h Change: {coin.p24h_change}%</p>
      <p>7d Change: {coin.p7d_change}%</p>
      <p>CMC id: {coin.cmcId}</p>
      <br/>

      <p className="text-gray-700">Krakenprice {coin.ticker.krakenCandle[0].price.toFixed(4)}</p>
      <p className="text-gray-700">24h kraken Change: {coin.ticker.krakenCandle[0].last288change.toFixed(2)}%</p>
      <p className="text-gray-700">RSI {coin.ticker.krakenCandle[0].rsi14.toFixed(2)}</p>
    </div>
  );
}
