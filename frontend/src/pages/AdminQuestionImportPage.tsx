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
      setError('请选择 xls 或 xlsx 格式的文件');
      event.target.value = '';
      setFile(null);
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setError('文件不能超过 20M');
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
      setError('请先选择并上传题库文件');
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
          <div className="q-import-actions">
            <a className="ghost-button" href="/api/app/admin/question-template" download>
              下载模板
            </a>
            <Link className="ghost-button" to="/admin/questions">
              返回题库
            </Link>
          </div>
        </div>

        <ol className="q-import-steps">
          <li>
            <span>1</span>
            <div>
              <b>下载模板</b>
              <p>第 1 行是表头、第 2–10 行为示例，从第 11 行开始填写正式题目。</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <b>选题库并上传</b>
              <p>指定题目归属的题库，选择 xls / xlsx 文件（≤ 20M）暂存到服务端。</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <b>一键导入</b>
              <p>逐行校验并写入数据库，任一行出错则整批回滚、不写入任何数据。</p>
            </div>
          </li>
        </ol>

        <form className="q-import-form" onSubmit={handleSubmit}>
          <label className="q-import-field">
            <span className="q-import-label">归属题库</span>
            <select value={fieldId} onChange={(event) => setFieldId(Number(event.target.value))}>
              <option value={0}>请选择题库</option>
              {fields.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>

          <label className="q-import-field">
            <span className="q-import-label">导入文件</span>
            <span className="q-import-file-wrap">
              <span className={`q-import-file-filename${file ? ' has-file' : ''}`}>
                {file ? file.name : '请选择 xls / xlsx 文件'}
              </span>
              <span className="q-import-file-browse">选择文件</span>
              <input
                className="q-import-file"
                type="file"
                accept=".xls,.xlsx"
                onChange={(event) => void handleFileChange(event)}
              />
            </span>
          </label>

          <div className="q-import-form-action">
            <button className="primary-button" type="submit" disabled={uploading || importing}>
              {importing ? '导入中…' : uploading ? '上传中…' : '开始导入'}
            </button>
          </div>
        </form>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="q-import-msg ok">{message}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <h2>导入要求</h2>
          <span>先决条件</span>
        </div>

        <div className="q-import-status">
          <div>
            <b>本地文件</b>
            <span title={file?.name}>{file?.name || '未选择'}</span>
          </div>
          <div>
            <b>服务端路径</b>
            <span title={serverPath}>{serverPath || '-'}</span>
          </div>
          <div>
            <b>状态</b>
            <span>{serverPath ? '已上传，可导入' : '等待上传'}</span>
          </div>
        </div>

        <ul className="q-import-notes">
          <li>请确认题库、知识类和答题人阶段已在系统中预先配置好。</li>
          <li>判断题答案支持「正确 / 错误」，也兼容「对 / 错 / T / F」写法，统一保存为「正确 / 错误」。</li>
          <li>模板中的「难度」列会同步保存到题目难度字段。</li>
          <li>文件必须是 xls 或 xlsx 格式，且大小不超过 20M。</li>
        </ul>
      </section>
    </div>
  );
}