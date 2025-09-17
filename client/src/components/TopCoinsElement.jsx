import MyCard from "./elements/MyCard";

export default function TopCoinsElement({ TopCoins, string, onSelect  }) {
  return (
    <div className="text-center">
      <h2 className="text-xl ">Top {string} last hour</h2>
      <div className="grid grid-cols-3 m-2 gap-4 mb-8">
        {TopCoins.map((TopCoin) => (
          <MyCard key={TopCoin.id} coin={TopCoin} onClick={() => onSelect(TopCoin)} />
        ))}
      </div>
    </div>

  );
}