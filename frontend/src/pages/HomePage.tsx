import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHome } from '../api';
import type { ExamPaper, HomePayload, QuestionImproveResult } from '../types';

function PaperSection({ title, papers }: { title: string; papers: ExamPaper[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{papers.length} 份试卷</span>
      </div>
      <div className="paper-grid">
        {papers.map((paper) => (
          <article key={paper.id} className="paper-card">
            <h3>{paper.name}</h3>
            <p>{paper.summary || '系统试卷，保持原始数据结构兼容。'}</p>
            <dl>
              <div>
                <dt>时长</dt>
                <dd>{paper.duration} 分钟</dd>
              </div>
              <div>
                <dt>总分</dt>
                <dd>{paper.total_point}</dd>
              </div>
            </dl>
            <Link className="primary-button" to={`/student/exam/${paper.id}`}>
              进入考试
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const [payload, setPayload] = useState<HomePayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchHome()
      .then(setPayload)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, []);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload) {
    return <div className="page-state">正在加载首页数据...</div>;
  }

  const classifyEntries = Object.entries(payload.classifyMap || {});
  const wrongEntries = Object.entries(payload.wrongKnowledgeMap || {});

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Current Brand Palette</p>
          <h2>现代科技风前端壳已接入原系统能力</h2>
          <p>
            主色继续沿用企业题库的橙色和石墨灰，练习入口、试卷入口和后台入口都基于兼容 API 输出。
          </p>
        </div>
        <div className="hero-metrics">
          <div className="metric-card">
            <span>知识点分组</span>
            <strong>{classifyEntries.length}</strong>
          </div>
          <div className="metric-card">
            <span>错题知识点</span>
            <strong>{wrongEntries.length}</strong>
          </div>
          <div className="metric-card">
            <span>可考试卷</span>
            <strong>
              {payload.historypaper.length + payload.practicepaper.length + payload.expertpaper.length}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>强化练习入口</h2>
          <span>按知识类与题型启动练习</span>
        </div>
        <div className="practice-grid">
          {classifyEntries.slice(0, 12).map(([pointName, items]) => (
            <article key={pointName} className="practice-card">
              <h3>{pointName}</h3>
              <ul>
                {items.map((item: QuestionImproveResult) => (
                  <li key={`${item.questionPointId}-${item.questionTypeId}`}>
                    <div>
                      <strong>{item.questionTypeName}</strong>
                      <span>
                        共 {item.amount} 题 / 已做 {item.rightTimes + item.wrongTimes} 题
                      </span>
                    </div>
                    <Link
                      className="ghost-button"
                      to={`/student/practice/point/${item.questionPointId}/${item.questionTypeId}`}
                    >
                      开始
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <PaperSection title="随机组卷" papers={payload.historypaper} />
      <PaperSection title="模拟试卷" papers={payload.practicepaper} />
      <PaperSection title="专家试卷" papers={payload.expertpaper} />
    </div>
  );
}
