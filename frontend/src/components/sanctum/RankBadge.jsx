export default function RankBadge({ rank }) {
  if (!rank) return null;
  return (
    <span className={`s-rank-badge s-rank-${rank}`}>
      {rank}
    </span>
  );
}
