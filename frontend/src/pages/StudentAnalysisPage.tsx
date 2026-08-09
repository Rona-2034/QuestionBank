import { useEffect, useState } from 'react';
import { fetchStudentAnalysis } from '../api';
import type { StudentAnalysisPayload } from '../types';

export function StudentAnalysisPage() {
  const [payload, setPayload] = useState<StudentAnalysisPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchStudentAnalysis()
      .then(setPayload)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, []);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload) {
    return <div className="page-state">正在加载分析数据...</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Student Intelligence</p>
          <h2>学习分析中心</h2>
          <p>沿用旧系统统计口径，展示知识点完成率、正确率和答题人阶段分析。</p>
        </div>
        <div className="hero-metrics">
          <div className="metric-card">
            <span>最后登录</span>
            <strong style={{ fontSize: 18 }}>{payload.lastLoginTime || '-'}</strong>
          </div>
          <div className="metric-card">
            <span>知识点统计</span>
            <strong>{payload.kparl.length}</strong>
          </div>
          <div className="metric-card">
            <span>答题阶段</span>
            <strong>{payload.answerStageAnalysisList.length}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>知识点分析</h2>
          <span>完成率 / 正确率</span>
        </div>
        <div className="hero-metrics">
          {payload.kparl.map((item) => (
            <article key={item.pointId} className="metric-card">
              <span>{item.pointName}</span>
              <strong>{Math.round(item.finishRate * 100)}%</strong>
              <p className="status-note">
                共 {item.amount} 题，答对 {item.rightTimes}，答错 {item.wrongTimes}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>答题人阶段</h2>
          <span>阶段维度统计</span>
        </div>
        <div className="result-list">
          {payload.answerStageAnalysisList.map((stage) => (
            <article key={stage.knowledgePointId} className="practice-card">
              <h3>{stage.knowledgePointName}</h3>
              <p>完成率 {Math.round(stage.finishRate * 100)}%</p>
              <div className="status-note">
                {stage.typeAnalysis.map((typeItem) => (
                  <div key={typeItem.questionTypeId} style={{ marginTop: 10 }}>
                    <strong>{typeItem.questionTypeName}</strong>
                    <div>
                      剩余 {typeItem.restAmount}，答对 {typeItem.rightAmount}，答错 {typeItem.wrongAmount}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
