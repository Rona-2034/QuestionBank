import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchExam, submitExam, uploadStudentQuestionImage } from '../api';
import type { AnswerSheetItemPayload, ExamPayload, ExamResultPayload } from '../types';

function SubjectiveImageUpload({
  questionId,
  images,
  onChange,
}: {
  questionId: number;
  images: string[];
  onChange: (questionId: number, images: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const path = await uploadStudentQuestionImage(file);
      onChange(questionId, [...images, path]);
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="answer-image-tools">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => void handleFile(event)}
      />
      <button
        type="button"
        className="ghost-button image-insert-button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? '上传中...' : '插入图片'}
      </button>
      {images.map((image, index) => (
        <span key={image} className="answer-image-chip">
          <img src={image.startsWith('/') ? image : `/${image}`} alt={`答题图片${index + 1}`} />
          <button
            type="button"
            aria-label="删除图片"
            onClick={() => onChange(questionId, images.filter((_, i) => i !== index))}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

export function ExamPage() {
  const { examPaperId } = useParams();
  const [payload, setPayload] = useState<ExamPayload | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResultPayload | null>(null);
  const [imagesByQuestion, setImagesByQuestion] = useState<Record<number, string[]>>({});
  const [answeredIds, setAnsweredIds] = useState<Record<number, boolean>>({});
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!examPaperId) {
      return;
    }
    void fetchExam(examPaperId)
      .then((examPayload) => {
        setPayload(examPayload);
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

  const refreshAnswered = () => {
    if (!payload) {
      return;
    }
    const next: Record<number, boolean> = {};
    for (const item of payload.items) {
      const questionId = item.question.questionId;
      next[questionId] =
        readAnswer(questionId, item.question.questionTypeId) !== '' ||
        (imagesByQuestion[questionId] || []).length > 0;
    }
    setAnsweredIds(next);
  };

  useEffect(() => {
    refreshAnswered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesByQuestion, payload]);

  const collectAnswerSheet = (): Record<number, AnswerSheetItemPayload> => {
    if (!payload) {
      return {};
    }
    return payload.items.reduce<Record<number, AnswerSheetItemPayload>>((current, item) => {
      const questionId = item.question.questionId;
      const answer = readAnswer(questionId, item.question.questionTypeId);
      const images = imagesByQuestion[questionId] || [];
      if (answer || images.length) {
        current[questionId] = {
          question_type_id: item.question.questionTypeId,
          answer,
          point: item.question.questionPoint,
          images,
        };
      }
      return current;
    }, {});
  };

  const addQuestionNo = (html: string, index: number) =>
    html.replace(
      '<span class="question-no"></span>',
      `<span class="question-no">第${index + 1}题</span>`,
    );

  const scrollToQuestion = (questionId: number) => {
    itemRefs.current[questionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <span className="status-note">交卷成功，可到「考试历史」的作答详情查看统计与答题记录</span>
          ) : null}
        </div>
      </section>
      <section
        className="panel question-panel"
        onChange={() => refreshAnswered()}
        onInput={() => refreshAnswered()}
      >
        <ol className="question-render-list">
          {payload.items.map((item, index) => (
            <li key={item.question.questionId}>
              <div
                ref={(node) => {
                  itemRefs.current[item.question.questionId] = node;
                }}
                dangerouslySetInnerHTML={{ __html: addQuestionNo(item.html, index) }}
              />
              {item.question.questionTypeId >= 4 ? (
                <SubjectiveImageUpload
                  questionId={item.question.questionId}
                  images={imagesByQuestion[item.question.questionId] || []}
                  onChange={(questionId, images) =>
                    setImagesByQuestion((previous) => ({ ...previous, [questionId]: images }))
                  }
                />
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      {!result?.submitted ? (
        <div className="answer-card-float">
          <div className="answer-card-tab">答题卡</div>
          <div className="answer-card-popup">
            <div className="answer-card-title">共 {payload.items.length} 题 · 未答白色 / 已答橙色</div>
            <div className="answer-card-grid">
              {payload.items.map((item, index) => (
                <button
                  key={item.question.questionId}
                  type="button"
                  className={`answer-card-cell ${answeredIds[item.question.questionId] ? 'answered' : ''}`}
                  onClick={() => scrollToQuestion(item.question.questionId)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
