import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHome } from '../api';
import type { HomePayload } from '../types';

export function PracticeIndexPage() {
  const [payload, setPayload] = useState<HomePayload | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetchHome().then((data) => { if (active) setPayload(data); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : '题目加载失败'); });
    return () => { active = false; };
  }, []);
  const groups = Object.entries(payload?.classifyMap || {}).filter(([, items]) => items.length > 0);
  return <section className="panel page-stack">
    <div className="panel-heading"><h2>强化练习</h2><Link className="ghost-button" to="/home">返回工作台</Link></div>
    {error ? <div className="error-banner" role="alert">{error}</div> : !payload ? <p>正在加载题目...</p> :
      groups.length === 0 ? <div className="status-note" role="status"><h3>现在没有题目，敬请期待。</h3></div> :
      <div className="practice-grid">{groups.map(([name, items]) => <article className="practice-card" key={name}>
        <h3>{name}</h3><ul>{items.map((item) => <li key={`${item.questionPointId}-${item.questionTypeId}`}>
          <div><strong>{item.questionTypeName}</strong><span>共 {item.amount} 题</span></div>
          <Link className="primary-button" to={`/student/practice/point/${item.questionPointId}/${item.questionTypeId}`}>开始练习</Link>
        </li>)}</ul>
      </article>)}</div>}
  </section>;
}
