import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchStudentExamPapers } from '../api';
import { useAuth } from '../App';
import { isAdmin } from '../permissions';
import type { ExamPaper } from '../types';

export function StudentExamPapersPage() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const requestedType = Number(searchParams.get('paperType') || 0);
  const paperType = [1, 2, 3].includes(requestedType) ? requestedType : 0;
  const title = ['参加考试', '随机组卷', '模拟试卷', '专家试卷'][paperType];
  const [papers, setPapers] = useState<ExamPaper[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setPapers(null); setError('');
    fetchStudentExamPapers(paperType).then((result) => { if (active) setPapers(result.items); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : '试卷加载失败'); });
    return () => { active = false; };
  }, [paperType]);
  return <section className="panel page-stack">
    <div className="panel-heading"><h2>{title}</h2>
      <div className="secondary-actions"><Link className="ghost-button" to="/home">返回工作台</Link>
        {isAdmin(auth.user) ? <Link className="ghost-button" to="/admin/exam-papers">管理试卷</Link> : null}
      </div>
    </div>
    <p>选择已上线的试卷，进入考试后作答并提交，可在考试历史中查看结果。</p>
    {error ? <div className="error-banner">{error}</div> : papers === null ? <p>正在加载试卷...</p> :
      papers.length === 0 ? <div className="status-note">
        <h3>现在没有试卷，敬请期待。</h3>
        <p>管理员创建试卷、配置题目并上线后，会显示在这里。</p>
        {isAdmin(auth.user) ? <Link className="primary-button" to="/admin/exam-papers/new">创建试卷</Link> : <p>请联系管理员发布考试。</p>}
      </div> : <div className="paper-grid">{papers.map((paper) => <article className="paper-card" key={paper.id}>
        <h3>{paper.name}</h3><p>{paper.summary || '请在规定时间内完成作答并提交。'}</p>
        <p>时长 {paper.duration} 分钟 · 总分 {paper.total_point}</p>
        <Link className="primary-button" to={`/student/exam/${paper.id}`}>进入考试</Link>
      </article>)}</div>}
  </section>;
}
