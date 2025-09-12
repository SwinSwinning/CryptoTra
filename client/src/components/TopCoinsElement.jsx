import MyCard from "./elements/MyCard";

export default function TopCoinsElement({ TopCoins, string, onSelect  }) {
  return (
    <div><h2 className="">{string}</h2>
      <div className="grid grid-cols-3 m-2 gap-4">
        {TopCoins.map((TopCoin) => (
          <MyCard key={TopCoin.id} coin={TopCoin} onClick={() => onSelect(TopCoin)} />
        ))}
      </div>
    </div>

  );
}