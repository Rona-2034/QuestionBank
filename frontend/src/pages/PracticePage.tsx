import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPracticeByPoint, fetchPracticeByStage, fetchPracticeIncorrect, submitPractice } from '../api';
import type { PracticePayload } from '../types';
import { QuestionCommentPanel } from '../components/QuestionCommentPanel';

export function PracticePage() {
  const { mode, primaryId, questionTypeId } = useParams();
  const [payload, setPayload] = useState<PracticePayload | null>(null);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [submitState, setSubmitState] = useState<Record<number, string>>({});
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!mode || !primaryId || !questionTypeId) {
      return;
    }
    let loader: Promise<PracticePayload>;
    if (mode === 'stage') {
      loader = fetchPracticeByStage(primaryId, questionTypeId);
    } else if (mode === 'incorrect') {
      loader = fetchPracticeIncorrect(primaryId);
    } else {
      loader = fetchPracticeByPoint(primaryId, questionTypeId);
    }
    void loader.then(setPayload).catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    });
  }, [mode, primaryId, questionTypeId]);

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

  const handleSubmit = async (question: PracticePayload['items'][number]['question']) => {
    const answer = readAnswer(question.questionId, question.questionTypeId);
    if (!answer) {
      setSubmitState((current) => ({
        ...current,
        [question.questionId]: '请先作答后再提交。',
      }));
      return;
    }
    setSubmittingId(question.questionId);
    try {
      const response = await submitPractice({
        questionId: question.questionId,
        questionTypeId: question.questionTypeId,
        pointId: question.knowledgePointId,
        answer: question.answer,
        myAnswer: answer,
        from: 1,
      });
      setSubmitState((current) => ({
        ...current,
        [question.questionId]: response.isRight ? '回答正确，已写入练习历史。' : '回答错误，已写入练习历史。',
      }));
      setPayload((current) => {
        if (!current) {
          return current;
        }
        const finishedQuestionIds = new Set(current.finishedQuestionIds || []);
        finishedQuestionIds.add(question.questionId);
        return {
          ...current,
          finishedQuestionIds: Array.from(finishedQuestionIds),
        };
      });
    } catch (requestError) {
      setSubmitState((current) => ({
        ...current,
        [question.questionId]: requestError instanceof Error ? requestError.message : '提交失败',
      }));
    } finally {
      setSubmittingId(null);
    }
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload) {
    return <div className="page-state">正在加载练习题...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>{payload.practiceName}</h2>
          <span>
            {payload.fieldName} / {payload.questionTypeName} / {payload.amount} 题
          </span>
        </div>
        {payload.finishedQuestionIds?.length ? (
          <p className="status-note">
            已完成题目 ID：{payload.finishedQuestionIds.join(', ')}
          </p>
        ) : null}
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
              <div className="action-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void handleSubmit(item.question)}
                  disabled={submittingId === item.question.questionId}
                >
                  {submittingId === item.question.questionId ? '提交中...' : '提交本题'}
                </button>
                {submitState[item.question.questionId] ? (
                  <span className="status-note">{submitState[item.question.questionId]}</span>
                ) : null}
              </div>
              <QuestionCommentPanel questionId={item.question.questionId} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
