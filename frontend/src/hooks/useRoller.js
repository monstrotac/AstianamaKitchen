import { useState, useCallback } from 'react';
import { SF, FF, N20, N1, pick } from '../data/flavorText';

export function useRoller() {
  const [rolling, setRolling]     = useState(false);
  const [dieDisplay, setDieDisplay] = useState('—');
  const [spinning, setSpinning]   = useState(false);
  const [result, setResult]       = useState(null); // { nat, mod, total, dc, outcome, oc, oc2, pc, flavor, breakdown }

  const roll = useCallback((skillBonus, baseModifier, dc) => {
    if (rolling) return;
    setRolling(true);
    setSpinning(true);

    let count = 0, max = 22;
    const iv = setInterval(() => {
      setDieDisplay(Math.floor(Math.random() * 20) + 1);
      count++;
      if (count >= max) {
        clearInterval(iv);
        const nat = Math.floor(Math.random() * 20) + 1;
        const mod = skillBonus + baseModifier;
        const tot = nat + mod;
        setDieDisplay(nat);
        setSpinning(false);

        let oc, oc2, pc, flavor;
        if (nat === 20) {
          oc = 'CRITICAL SUCCESS — THE BLADE SINGS'; oc2 = 'n20'; pc = 'n20'; flavor = pick(N20);
        } else if (nat === 1) {
          oc = 'CRITICAL FAILURE — THE THORN TURNS'; oc2 = 'n1'; pc = 'no'; flavor = pick(N1);
        } else if (tot >= dc) {
          oc = 'SUCCESS — THE HARVEST IS TAKEN'; oc2 = 'ok'; pc = 'ok'; flavor = pick(SF);
        } else {
          oc = 'FAILURE — THE GARDEN HOLDS'; oc2 = 'no'; pc = 'no'; flavor = pick(FF);
        }

        setResult({
          nat, mod, tot, dc,
          outcome: oc2 === 'nat20' || oc2 === 'n20' ? 'nat20' : oc2 === 'n1' ? 'nat1' : pc === 'ok' ? 'success' : 'failure',
          oc, oc2, pc, flavor,
          breakdown: `Natural: ${nat}  +  Modifier: +${mod}  =  Total: ${tot}  vs  DC ${dc}`
        });
        setRolling(false);
      }
    }, 55);
  }, [rolling]);

  return { rolling, dieDisplay, spinning, result, roll };
}
