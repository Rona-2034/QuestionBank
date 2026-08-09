import { FormEvent, useEffect, useState } from 'react';
import { fetchQuestionComments, submitQuestionComment } from '../api';
import type { CommentItem } from '../types';

interface QuestionCommentPanelProps {
  questionId: number;
}

function formatCommentTime(value?: string) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function QuestionCommentPanel({ questionId }: QuestionCommentPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchQuestionComments(questionId, 1, 0);
      if (response.result === 'success' && response.object) {
        setComments(response.object.comments || []);
        setTotal(response.object.size || 0);
      } else {
        setComments([]);
        setTotal(0);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [questionId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!content.trim()) {
      setError('评论不能为空');
      return;
    }
    if (content.trim().length > 40) {
      setError('请保持在 1 到 40 个字符以内');
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitQuestionComment({
        questionId,
        contentMsg: content.trim(),
      });
      if (response.result === 'success') {
        setContent('');
        await load();
      } else {
        setError(response.messageInfo || response.result || '提交失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>评论</h2>
        <span>
          {loading ? '加载中...' : `共 ${total} 条`}
        </span>
      </div>
      <form className="filter-grid" onSubmit={handleSubmit}>
        <label style={{ gridColumn: 'span 2' }}>
          评论内容
          <textarea
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? '提交中...' : '发表评论'}
        </button>
      </form>
      {error ? <div className="error-banner" style={{ marginTop: 12 }}>{error}</div> : null}
      <div className="result-list" style={{ marginTop: 16 }}>
        {comments.map((comment) => (
          <article key={comment.commentId} className="practice-card">
            <h3>
              {comment.username}
              <span className="status-note" style={{ marginLeft: 8 }}>
                {formatCommentTime(comment.createTime)}
              </span>
            </h3>
            <p>{comment.contentMsg}</p>
          </article>
        ))}
        {!loading && comments.length === 0 ? (
          <div className="status-note">暂无评论</div>
        ) : null}
      </div>
    </section>
  );
}
