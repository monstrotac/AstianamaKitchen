export default function BonusBox({ attrMod = 0, skillRank = 0, label = '' }) {
  const total = attrMod + skillRank;
  return (
    <div className="bonus-box">
      {label && (
        <div className="brow">
          <span className="bn">Roll</span>
          <span className="bv" style={{ fontSize: '0.75rem' }}>{label}</span>
        </div>
      )}
      <div className="brow">
        <span className="bn">Attribute Mod</span>
        <span className="bv">{attrMod >= 0 ? `+${attrMod}` : attrMod}</span>
      </div>
      <div className="brow">
        <span className="bn">Skill Rank</span>
        <span className="bv">{skillRank >= 0 ? `+${skillRank}` : skillRank}</span>
      </div>
      <div className="brow total">
        <span className="bn">Total Modifier</span>
        <span className="bv">{total >= 0 ? `+${total}` : total}</span>
      </div>
    </div>
  );
}
