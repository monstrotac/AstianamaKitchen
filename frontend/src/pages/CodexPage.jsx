import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

function ArticleSection({ title, subtitle, articles, accentClass }) {
  if (!articles.length) return null;
  return (
    <div className={`panel codex-section ${accentClass || ''}`}>
      <div className="panel-title">{title}</div>
      {subtitle && <div className="codex-section-sub">{subtitle}</div>}
      {articles.map(a => (
        <div key={a.id} className="codex-entry">
          <div className="c-num">{a.article_num}</div>
          <div className="c-rule">{a.body}</div>
        </div>
      ))}
    </div>
  );
}

export default function CodexPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    client.get('/codex').then(r => setArticles(r.data)).catch(() => {});
  }, []);

  const standing  = articles.filter(a => a.category === 'standing_articles');
  const scythes   = articles.filter(a => a.category === 'scythes_code');
  const veil      = articles.filter(a => a.category === 'veil_code');

  return (
    <div>
      <ArticleSection
        title="The Gardeners' Code — Standing Articles"
        articles={standing}
      />

      {user && (
        <div className="panel">
          <div className="panel-title">Identity Record</div>
          <div className="id-grid">
            <div className="id-card">
              <div className="id-badge">THE FACE</div>
              <div className="id-facts">
                The person behind the operative — the civilian identity, the mask worn in plain sight.
              </div>
            </div>
            <div className="id-card secret">
              <div className="id-badge">THE GARDENER</div>
              <div className="id-facts">
                The assassin. The true self beneath the face — the operative known only within The Garden.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">The Order — Faction Overview</div>
        <div className="faction-grid">
          <div className="id-card">
            <div className="id-badge">THE VEIL</div>
            <div className="id-name">Spies &amp; Infiltrators</div>
            <div className="id-facts">
              They do not slay.<br />
              They move unseen through rooms.<br />
              They gather, they hold, they<br />
              deliver the wound when it counts.
            </div>
          </div>
          <div className="id-card secret">
            <div className="id-badge">THE SCYTHES</div>
            <div className="id-name red">Assassins &amp; Enforcers</div>
            <div className="id-facts">
              They bring many to their end.<br />
              Cloaked in darkness,<br />
              they harvest without mercy.<br />
              The blade does not sort.
            </div>
          </div>
          <div className="id-card id-card-solstice">
            <div className="id-badge id-badge-solstice">THE SOLSTICE</div>
            <div className="id-name id-name-solstice">The Leader</div>
            <div className="id-facts">
              Orders are absolute.<br />
              Desertion means death<br />
              from the hand of the Order.<br />
              There is no leaving it.
            </div>
          </div>
        </div>
      </div>

      <ArticleSection
        title="The Scythes' Code"
        subtitle="For those who carry the blade"
        articles={scythes}
        accentClass="codex-scythes"
      />

      <ArticleSection
        title="The Veil's Code"
        subtitle="For those who move unseen"
        articles={veil}
        accentClass="codex-veil"
      />
    </div>
  );
}
