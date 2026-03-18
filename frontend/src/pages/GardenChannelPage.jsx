import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { PHRASES } from '../data/comms';
import ContractFeedCard from '../components/contracts/ContractFeedCard';

const GLYPHS = '█▓▒░╔╗╚╝║═▄▀';

export default function GardenChannelPage() {
  const [txPhrase, setTxPhrase]     = useState(null);
  const [termText, setTermText]     = useState('');
  const [termLabel, setTermLabel]   = useState('');
  const [typing, setTyping]         = useState(null);
  const [active, setActive]         = useState([]);
  const [complete, setComplete]     = useState([]);
  const termRef = useRef(null);

  useEffect(() => {
    client.get('/contracts/feed/active').then(r => setActive(r.data)).catch(() => {});
    client.get('/contracts/feed/complete').then(r => setComplete(r.data)).catch(() => {});
  }, []);

  function transmit(phrase) {
    setTxPhrase(phrase.transmitLabel);
    if (typing) clearTimeout(typing);

    const full = phrase.transmitMsg + '\n\n>> ' + phrase.transmitMeta;
    setTermLabel(`[${phrase.transmitLabel}]  —  ${new Date().toLocaleTimeString()}`);
    setTermText('');

    let i = 0;
    function tick() {
      if (i >= full.length) { setTyping(null); return; }
      const char = full[i++];
      if (Math.random() < 0.04) {
        const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        setTermText(prev => prev + g);
        const t = setTimeout(() => {
          setTermText(prev => prev.slice(0, -1) + char);
          setTyping(setTimeout(tick, 28 + Math.random() * 18));
        }, 55);
        setTyping(t);
      } else {
        setTermText(prev => prev + char);
        setTyping(setTimeout(tick, 22 + Math.random() * 22));
      }
    }
    tick();
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Encrypted Transmission Protocols</div>
        <div className="comm-status">
          <div className="dot" />
          <span>CHANNEL ACTIVE — VOICE DISTORTION: ENABLED — IDENTITY: MASKED</span>
        </div>
        <div className="energy-line" />

        <div className="phrase-list">
          {PHRASES.map((p, i) => (
            <div
              key={i}
              className={`phrase${txPhrase === p.transmitLabel ? ' tx' : ''}`}
              onClick={() => transmit(p)}
            >
              <div className="p-label">{p.label}</div>
              <div className="p-text">{p.text}</div>
              <div className="p-meta">{p.meta}</div>
            </div>
          ))}
        </div>

        {(termText || termLabel) && (
          <div className="terminal" ref={termRef}>
            <div className="terminal-header">// ENCRYPTED CHANNEL — VOICE DISTORTION ACTIVE</div>
            <span style={{color:'rgba(220,20,60,0.8)',display:'block',marginBottom:4}}>{termLabel}</span>
            <span>{termText}</span>
            {typing && <span className="cursor" />}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">Active Contracts — Live Feed</div>
        {active.length === 0
          ? <div className="ct-empty">NO ACTIVE CONTRACTS</div>
          : active.map(c => <ContractFeedCard key={c.id} contract={c} />)
        }
      </div>

      <div className="panel">
        <div className="panel-title">Completed Contracts — The Harvest Record</div>
        {complete.length === 0
          ? <div className="ct-empty">NO COMPLETED CONTRACTS</div>
          : complete.map(c => <ContractFeedCard key={c.id} contract={c} />)
        }
      </div>
    </div>
  );
}
