import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAdminFields, importQuestionFile, uploadQuestionFile } from '../api';
import type { AdminFieldItem } from '../types';

export function AdminQuestionImportPage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<AdminFieldItem[]>([]);
  const [fieldId, setFieldId] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [serverPath, setServerPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetchAdminFields(1)
      .then((response) => {
        setFields(response.items);
        setFieldId(response.items[0]?.fieldId || 0);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载题库失败');
      });
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setServerPath('');
    setError('');
    setMessage('');
    if (!nextFile) {
      return;
    }
    if (!/\.(xls|xlsx)$/i.test(nextFile.name)) {
      setError('请上传 xls 或 xlsx 文件');
      event.target.value = '';
      setFile(null);
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setError('只能上传 20M 以下的文件');
      event.target.value = '';
      setFile(null);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadQuestionFile(nextFile);
      setServerPath(path);
      setMessage(`文件已上传：${nextFile.name}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '文件上传失败');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!fieldId) {
      setError('请选择题库');
      return;
    }
    if (!serverPath) {
      setError('请先上传题库文件');
      return;
    }
    setImporting(true);
    try {
      const response = await importQuestionFile(fieldId, serverPath);
      if (response.result === 'success') {
        setMessage(response.messageInfo || '导入成功');
        navigate('/admin/questions');
      } else {
        setError(response.messageInfo || response.result || '导入失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>导入试题</h2>
          <span>
            <Link className="ghost-button" to="/admin/questions">
              返回题库
            </Link>
          </span>
        </div>
        <p className="status-note">
          先上传 Excel 文件到服务端，再提交文件路径给 `/api/app/admin/questions/import/*`。保持老系统原始导入语义。
        </p>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            题库
            <select value={fieldId} onChange={(event) => setFieldId(Number(event.target.value))}>
              <option value={0}>-- 请选择 --</option>
              {fields.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>
          <label>
            导入文件
            <input type="file" accept=".xls,.xlsx" onChange={(event) => void handleFileChange(event)} />
          </label>
          <button className="primary-button" type="submit" disabled={uploading || importing}>
            {importing ? '导入中...' : uploading ? '上传中...' : '开始导入'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>文件状态</h2>
          <span>{serverPath ? '已上传到服务端' : '等待上传'}</span>
        </div>
        <div className="result-list">
          <article className="practice-card">
            <h3>本地文件</h3>
            <p>{file?.name || '未选择'}</p>
          </article>
          <article className="practice-card">
            <h3>服务端路径</h3>
            <p>{serverPath || '-'}</p>
          </article>
        </div>
        <ul className="status-note" style={{ marginTop: 16 }}>
          <li>请确认题库、知识类和答题人阶段已在系统中预先配置。</li>
          <li>文件必须是 xls 或 xlsx，且小于 20M。</li>
        </ul>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="status-note">{message}</div> : null}
    </div>
  );
}
