import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchExamReport, fetchExamResult } from '../api';
import type { ExamReportPayload, ExamResultPayload } from '../types';

function addQuestionNo(html: string, index: number) {
  return html.replace(
    '<span class="question-no"></span>',
    `<span class="question-no">第${index + 1}题</span>`,
  );
}

export function ExamReportPage() {
  const { examPaperId } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<ExamReportPayload | null>(null);
  const [result, setResult] = useState<ExamResultPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!examPaperId) {
      return;
    }
    Promise.all([fetchExamReport(examPaperId), fetchExamResult(examPaperId)])
      .then(([reportPayload, resultPayload]) => {
        setPayload(reportPayload);
        setResult(resultPayload);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, [examPaperId]);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload || !result) {
    return <div className="page-state">正在加载答卷分析...</div>;
  }
  if (!payload.items.length) {
    return <div className="page-state">该试卷暂无答卷记录。</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>答卷分析</h2>
          <span>{result.submitTime || '已提交'}</span>
        </div>
        <div className="action-row">
          <button className="ghost-button" type="button" onClick={() => navigate(-1)}>
            返回考试历史
          </button>
        </div>
      </section>
      {result.submitted ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>考试结果</h2>
            <span>共 {result.total} 题 · {result.passed ? '已通过' : '未通过'}</span>
          </div>
          <div className="hero-metrics">
            <div className="metric-card">
              <span>得分</span>
              <strong>{result.pointGet}</strong>
            </div>
            <div className="metric-card">
              <span>答对</span>
              <strong>{result.right}</strong>
            </div>
            <div className="metric-card">
              <span>答错</span>
              <strong>{result.wrong}</strong>
            </div>
          </div>
          <div className="result-list">
            {Object.entries(result.knowledgeStats || {}).map(([name, stat]) => (
              <article key={name} className="practice-card">
                <h3>{name}</h3>
                <p>
                  共 {stat.sum} 题，答对 {stat.rightTimes} 题，答错 {stat.wrongTimes} 题
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="panel question-panel">
        <div className="panel-heading">
          <h2>答题记录</h2>
          <span>沿用旧系统报告模板渲染</span>
        </div>
        <ol className="question-render-list">
          {payload.items.map((item, index) => (
            <li key={item.question.questionId}>
              <div dangerouslySetInnerHTML={{ __html: addQuestionNo(item.html, index) }} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
