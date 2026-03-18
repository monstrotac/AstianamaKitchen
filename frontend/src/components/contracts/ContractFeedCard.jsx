export default function ContractFeedCard({ contract, onClick }) {
  const isDone = contract.status === 'complete';
  return (
    <div className="comms-contract-card" onClick={() => onClick?.(contract)}>
      <div className="cc-badges">
        <span className={`cc-badge${isDone ? ' done' : ''}`}>{contract.status.toUpperCase()}</span>
        <span className="cc-badge muted">{contract.priority}</span>
        {contract.assigned_to_name && <span className="cc-badge muted">{contract.assigned_to_name}</span>}
      </div>
      <div className="cc-name">{contract.name}</div>
      <div className="cc-details">
        <span><b>Classification:</b>{contract.classification}</span>
        <span><b>Method:</b>{contract.method}</span>
        {isDone && contract.closed_approach && <span><b>Closed via:</b>{contract.closed_approach}</span>}
        {isDone && contract.closed_date && <span><b>Date:</b>{contract.closed_date}</span>}
      </div>
    </div>
  );
}
