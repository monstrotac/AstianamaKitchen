export default function CombatRulesModal({ onClose }) {
  return (
    <>
      <div className="s-overlay" onClick={onClose} />
      <div className="s-rules-panel" role="dialog" aria-label="Combat Rules">
        <div className="s-rules-header">
          <span className="s-rules-title">Combat Rules</span>
          <button className="s-btn small" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="s-rules-content">
          <section className="s-rules-section">
            <h3 className="s-rules-heading">Dice Mechanic</h3>
            <p>
              Roll 2d10 + modifier vs Difficulty Class (DC). The bell curve means
              rolls cluster around 11, making skill matter more than luck.
            </p>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">DC Scale</h3>
            <table className="s-rules-table">
              <thead><tr><th>DC</th><th>Difficulty</th></tr></thead>
              <tbody>
                <tr><td>6</td><td>Routine</td></tr>
                <tr><td>8</td><td>Simple</td></tr>
                <tr><td>12</td><td>Standard</td></tr>
                <tr><td>16</td><td>Demanding</td></tr>
                <tr><td>20</td><td>Punishing</td></tr>
                <tr><td>24</td><td>Extreme</td></tr>
                <tr><td>28</td><td>Impossible</td></tr>
              </tbody>
            </table>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">Contested Rolls</h3>
            <p>
              Attacker rolls 2d10 + Attack modifier. Defender&apos;s DC = 10 +
              Defense modifier. Defender chooses which defense to use (Dodge,
              Parry, etc.).
            </p>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">Critical Results</h3>
            <p>
              Double 10s (1% chance): Critical Success &mdash; automatic hit, deals 4
              damage that bypasses armor entirely. Double 1s (1% chance): Critical
              Failure &mdash; automatic miss with narrative complication.
            </p>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">Damage Tiers</h3>
            <p>
              Damage is based on the <strong>margin</strong> &mdash; how much your
              attack roll exceeds the defender&apos;s DC.
            </p>
            <table className="s-rules-table">
              <thead><tr><th>Margin</th><th>Tier</th><th>Damage</th></tr></thead>
              <tbody>
                <tr><td>0-3</td><td>Glancing</td><td>1</td></tr>
                <tr><td>4-6</td><td>Solid</td><td>2</td></tr>
                <tr><td>7-9</td><td>Hard</td><td>3</td></tr>
                <tr><td>10+</td><td>Devastating</td><td>4</td></tr>
              </tbody>
            </table>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">Armor &amp; Soak</h3>
            <p>
              Armor reduces damage. Solid+ hits always deal at least 1 after soak.
              Glancing blows can be fully absorbed. Crits bypass soak.
            </p>
            <table className="s-rules-table">
              <thead><tr><th>Armor</th><th>Soak</th><th>Dodge Penalty</th></tr></thead>
              <tbody>
                <tr><td>Unarmored</td><td>0</td><td>&mdash;</td></tr>
                <tr><td>Light</td><td>1</td><td>&mdash;</td></tr>
                <tr><td>Medium</td><td>2</td><td>-2</td></tr>
                <tr><td>Heavy</td><td>3</td><td>-4</td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.8rem', color: 'var(--dim)', marginTop: '0.5rem' }}>
              Lightsabers bypass soak on every hit. Slugthrowers cannot be deflected by lightsabers.
            </p>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">Force Powers Quick Reference</h3>
            <ul className="s-rules-list">
              <li><strong>Combat Enhancement</strong> (Minor, 1 FP): +2 attack AND defense this round</li>
              <li><strong>Force Speed</strong> (Minor, 2 FP): Two attacks, or close+attack, or disengage+attack</li>
              <li><strong>Force Lightning</strong> (Action, 2 FP): Flat 2 damage + Stunned. Dark Side only.</li>
              <li><strong>Force Push</strong> (Action, 1 FP): Margin damage + Prone + knockback</li>
              <li><strong>Force Healing</strong> (Action, 1 FP): Restores HP based on margin. DC increases per successive heal.</li>
              <li><strong>Force Barrier</strong> (Minor, 1 FP): +2 soak this round</li>
            </ul>
          </section>

          <section className="s-rules-section">
            <h3 className="s-rules-heading">Conditions Quick Reference</h3>
            <ul className="s-rules-list">
              <li><strong>Prone:</strong> -2 atk; melee vs you +2; ranged vs you -2</li>
              <li><strong>Stunned:</strong> Can&apos;t act; -4 defense (1 turn)</li>
              <li><strong>Disarmed:</strong> Can&apos;t use weapon; Action to retrieve</li>
              <li><strong>Grappled:</strong> Immobile; -2 attacks; no Dodge</li>
              <li><strong>Blinded:</strong> -4 attacks; -2 Dodge</li>
              <li><strong>Immobilized:</strong> Can&apos;t move; -2 Dodge</li>
              <li><strong>Frightened:</strong> -2 all vs source; can&apos;t approach</li>
              <li><strong>Slowed:</strong> -2 Dodge; can&apos;t close distance</li>
              <li><strong>Mind-Controlled:</strong> Actions controlled by caster</li>
              <li><strong>Wounded:</strong> -2 to all rolls (at 1 HP)</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
