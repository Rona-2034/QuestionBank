import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import seavoLogo from '../assets/seavo-logo.svg';

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [truename, setTruename] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'member' | 'admin'>('member');
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+\-]+@seavo\.com$/.test(normalizedEmail)) {
      setError('请使用 @seavo.com 公司邮箱');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致，请重新确认');
      return;
    }
    if (accountType === 'admin' && !registrationCode) {
      setError('请输入管理员注册码');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await registerUser({ email: normalizedEmail, password, truename: truename.trim(),
        accountType, ...(accountType === 'admin' ? { registrationCode } : {}) });
      if (response.result !== 'success') throw new Error(response.messageInfo || '注册失败');
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '注册失败');
    } finally { setSubmitting(false); }
  };
  return (
    <div className="auth-page"><div className="auth-card">
      <div className="auth-brand">
        <img className="auth-logo" src={seavoLogo} alt="SEAVO" /><h1>注册题库账号</h1>
        <p>使用 @seavo.com 公司邮箱注册，无需邮箱验证码。普通成员可学习和考试；业务管理员需注册码，可组卷及管理业务数据，不能管理管理员账号。</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>注册身份<select value={accountType} onChange={(event) => {
          setAccountType(event.target.value as 'member' | 'admin');
          setRegistrationCode(''); setError('');
        }}>
          <option value="member">普通成员</option>
          <option value="admin">业务管理员</option>
        </select></label>
        {accountType === 'admin' ? <label>管理员注册码<input type="password" autoComplete="off"
          required maxLength={128} placeholder="请向管理员获取注册码" value={registrationCode}
          onChange={(event) => setRegistrationCode(event.target.value)} /></label> : null}
        <label>公司邮箱<input type="email" autoComplete="email" required maxLength={40}
          placeholder="name@seavo.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>姓名<input autoComplete="name" required maxLength={40} placeholder="请输入真实姓名"
          value={truename} onChange={(event) => setTruename(event.target.value)} /></label>
        <label>密码<input type="password" autoComplete="new-password" required minLength={1} maxLength={40}
          value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label>确认密码<input type="password" autoComplete="new-password" required minLength={1} maxLength={40}
          placeholder="请再次输入密码" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        {error ? <div className="error-banner" role="alert">{error}</div> : null}
        <button className="primary-button" type="submit" disabled={submitting}>{submitting ? '注册中...' : accountType === 'admin' ? '注册管理员账号' : '注册账号'}</button>
        <Link to="/login" className="ghost-button">已有账号，返回登录</Link>
      </form>
    </div></div>
  );
}
