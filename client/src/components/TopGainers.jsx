import MyCard from "./elements/MyCard";

export default function TopGainers({topGainers  }) {
  return (
  
  <div className="grid grid-cols-2 gap-4">
      {topGainers.map((gainer) => (
        <MyCard gainer={gainer}/>
      ))}
    </div>
      );
}