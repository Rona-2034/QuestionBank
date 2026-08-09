import { useEffect, useState } from 'react';
import { fetchUserCenter } from '../api';
import type { UserCenterPayload } from '../types';

export function UserCenterPage() {
  const [payload, setPayload] = useState<UserCenterPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchUserCenter()
      .then(setPayload)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, []);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload) {
    return <div className="page-state">正在加载成员信息...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>成员中心</h2>
          <span>兼容当前 Session 用户结构</span>
        </div>
        <div className="profile-grid">
          <div className="profile-card">
            <span>账号</span>
            <strong>{payload.username || '-'}</strong>
          </div>
          <div className="profile-card">
            <span>姓名</span>
            <strong>{payload.username || '-'}</strong>
          </div>
          <div className="profile-card">
            <span>邮箱</span>
            <strong>{payload.email || '-'}</strong>
          </div>
          <div className="profile-card">
            <span>题库权限</span>
            <strong>{payload.field || '全部题库'}</strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>知识点统计</h2>
          <span>{payload.statistics.length} 个知识点</span>
        </div>
        <div className="result-list">
          {payload.statistics.map((item) => (
            <article key={item.pointId} className="practice-card">
              <h3>{item.pointName}</h3>
              <p>
                共 {item.amount} 题，完成 {Math.round(item.finishRate * 100)}%，正确率{' '}
                {Math.round(item.rightRate * 100)}%
              </p>
              <p>
                答对 {item.rightTimes} 题，答错 {item.wrongTimes} 题
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>阶段分析</h2>
          <span>沿用老系统答题人阶段统计逻辑</span>
        </div>
        <div className="result-list">
          {payload.answerStageAnalysisList.map((item) => (
            <article key={item.knowledgePointId} className="practice-card">
              <h3>{item.knowledgePointName}</h3>
              <p>完成率 {Math.round(item.finishRate * 100)}%</p>
              <ul>
                {item.typeAnalysis.map((type) => (
                  <li key={`${item.knowledgePointId}-${type.questionTypeId}`}>
                    {type.questionTypeName}：剩余 {type.restAmount}，答对 {type.rightAmount}，答错{' '}
                    {type.wrongAmount}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
