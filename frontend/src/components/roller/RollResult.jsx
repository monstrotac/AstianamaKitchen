export default function RollResult({ result }) {
  if (!result) {
    return (
      <div className="result">
        <div className="r-idle">AWAITING ROLL — THE GARDEN HOLDS ITS BREATH</div>
      </div>
    );
  }
  const { oc, oc2, flavor, breakdown } = result;
  const pc = oc2 === 'ok' || oc2 === 'crit_success' ? 'ok' : 'no';
  return (
    <div className={`result ${pc}`}>
      <div className={`r-outcome ${oc2}`}>{oc}</div>
      <div className="r-break">{breakdown}</div>
      <div className="r-flavor">{flavor}</div>
    </div>
  );
}
