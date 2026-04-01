import { useState, useCallback } from 'react';
import { SF, FF, CRIT_SUCCESS, CRIT_FAILURE, pick } from '../data/flavorText';
import { computeDamageTier } from '../utils/rollUtils';

export function useRoller() {
  const [rolling, setRolling]           = useState(false);
  const [die1Display, setDie1Display]   = useState('—');
  const [die2Display, setDie2Display]   = useState('—');
  const [spinning, setSpinning]         = useState(false);
  const [result, setResult]             = useState(null);

  const roll = useCallback((modifier, dc, isCombatRoll = false) => {
    if (rolling) return;
    setRolling(true);
    setSpinning(true);

    let count = 0;
    const max = 18;
    const iv = setInterval(() => {
      setDie1Display(Math.floor(Math.random() * 10) + 1);
      setDie2Display(Math.floor(Math.random() * 10) + 1);
      count++;
      if (count >= max) {
        clearInterval(iv);
        const d1 = Math.floor(Math.random() * 10) + 1;
        const d2 = Math.floor(Math.random() * 10) + 1;
        const total = d1 + d2 + modifier;
        setDie1Display(d1);
        setDie2Display(d2);
        setSpinning(false);

        let oc, oc2, flavor, outcome, margin = null, damageTier = null;

        if (d1 === 10 && d2 === 10) {
          oc = 'CRITICAL SUCCESS'; oc2 = 'crit_success'; outcome = 'crit_success';
          flavor = pick(CRIT_SUCCESS);
          margin = total - dc;
          damageTier = { label: 'Devastating', damage: 4 }; // crits bypass armor, always 4
        } else if (d1 === 1 && d2 === 1) {
          oc = 'CRITICAL FAILURE'; oc2 = 'crit_failure'; outcome = 'crit_failure';
          flavor = pick(CRIT_FAILURE);
        } else if (total >= dc) {
          oc = 'SUCCESS'; oc2 = 'ok'; outcome = 'success';
          flavor = pick(SF);
          margin = total - dc;
          if (isCombatRoll) damageTier = computeDamageTier(margin);
        } else {
          oc = 'FAILURE'; oc2 = 'no'; outcome = 'failure';
          flavor = pick(FF);
        }

        setResult({
          die1: d1, die2: d2, modifier, total, dc,
          outcome, oc, oc2, flavor,
          margin, damageTier,
          breakdown: `Die 1: ${d1}  +  Die 2: ${d2}  +  Modifier: +${modifier}  =  Total: ${total}  vs  DC ${dc}`,
        });
        setRolling(false);
      }
    }, 55);
  }, [rolling]);

  return { rolling, die1Display, die2Display, spinning, result, roll };
}
