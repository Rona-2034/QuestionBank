import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchExam, fetchExamReport, fetchExamResult, submitExam } from '../api';
import type { AnswerSheetItemPayload, ExamPayload, ExamReportPayload, ExamResultPayload } from '../types';
import { QuestionCommentPanel } from '../components/QuestionCommentPanel';

export function ExamPage() {
  const { examPaperId } = useParams();
  const [payload, setPayload] = useState<ExamPayload | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResultPayload | null>(null);
  const [report, setReport] = useState<ExamReportPayload | null>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!examPaperId) {
      return;
    }
    void fetchExam(examPaperId)
      .then(async (examPayload) => {
        setPayload(examPayload);
        const examResult = await fetchExamResult(examPaperId);
        setResult(examResult);
        if (examResult.submitted) {
          const examReport = await fetchExamReport(examPaperId);
          setReport(examReport);
        }
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, [examPaperId]);

  const readAnswer = (questionId: number, typeId: number) => {
    const root = itemRefs.current[questionId];
    if (!root) {
      return '';
    }
    if (typeId === 2) {
      return Array.from(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'))
        .map((input) => input.value)
        .sort()
        .join(',');
    }
    if (typeId === 4 || typeId >= 5) {
      return root.querySelector<HTMLTextAreaElement>('textarea')?.value.trim() || '';
    }
    return root.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value || '';
  };

  const collectAnswerSheet = (): Record<number, AnswerSheetItemPayload> => {
    if (!payload) {
      return {};
    }
    return payload.items.reduce<Record<number, AnswerSheetItemPayload>>((current, item) => {
      const answer = readAnswer(item.question.questionId, item.question.questionTypeId);
      if (answer) {
        current[item.question.questionId] = {
          question_type_id: item.question.questionTypeId,
          answer,
          point: item.question.questionPoint,
        };
      }
      return current;
    }, {});
  };

  const handleSubmit = async () => {
    if (!payload) {
      return;
    }
    const answerSheet = collectAnswerSheet();
    if (!Object.keys(answerSheet).length) {
      setError('请至少完成一道题后再交卷。');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const examResult = await submitExam({
        exam_history_id: payload.examHistoryId,
        duration: payload.durationSeconds,
        as: answerSheet,
      });
      setResult(examResult);
      setReport(await fetchExamReport(String(payload.examPaperId)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '交卷失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload) {
    return <div className="page-state">正在加载考试...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>{payload.paper.name}</h2>
          <span>
            考试时长 {Math.round(payload.durationSeconds / 60)} 分钟 / 历史记录 #{payload.examHistoryId}
          </span>
        </div>
        <div className="hero-metrics">
          <div className="metric-card">
            <span>总题数</span>
            <strong>{payload.items.length}</strong>
          </div>
          <div className="metric-card">
            <span>总分</span>
            <strong>{payload.paper.total_point}</strong>
          </div>
          <div className="metric-card">
            <span>及格线</span>
            <strong>{payload.paper.pass_point}</strong>
          </div>
        </div>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? '正在交卷...' : '提交试卷'}
          </button>
          {result?.submitted ? (
            <span className="status-note">
              最近交卷：得分 {result.pointGet} / {result.paper.total_point}，{result.passed ? '已通过' : '未通过'}
            </span>
          ) : null}
        </div>
      </section>
      <section className="panel question-panel">
        <ol className="question-render-list">
          {payload.items.map((item) => (
            <li key={item.question.questionId}>
              <div
                ref={(node) => {
                  itemRefs.current[item.question.questionId] = node;
                }}
                dangerouslySetInnerHTML={{ __html: item.html }}
              />
              <QuestionCommentPanel questionId={item.question.questionId} />
            </li>
          ))}
        </ol>
      </section>
      {result?.submitted ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>考试结果</h2>
            <span>{result.submitTime || '已提交'}</span>
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
      {report?.items.length ? (
        <section className="panel question-panel">
          <div className="panel-heading">
            <h2>答卷报告</h2>
            <span>沿用旧系统报告模板渲染</span>
          </div>
          <ol className="question-render-list">
            {report.items.map((item) => (
              <li key={item.question.questionId}>
                <div dangerouslySetInnerHTML={{ __html: item.html }} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
