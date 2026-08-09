import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { AuthUser } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  user: AuthUser | null;
  onLogout(): Promise<void>;
}

interface NavItem {
  to: string;
  label: string;
  matchPaths?: string[];
}

export function AppShell({ children, user, onLogout }: AppShellProps) {
  const location = useLocation();
  const roles = user?.rolesName || '';
  const isAdmin = roles.includes('管理员');
  const navGroups = [
    {
      id: 'learning',
      title: '学习中心',
      items: [
        { to: '/student/user-center', label: '成员中心' },
        { to: '/student/analysis', label: '学习分析' },
        { to: '/student/exam-history', label: '考试历史' },
      ],
    },
    {
      id: 'account',
      title: '账户设置',
      items: [
        { to: '/student/setting', label: '个人设置' },
        { to: '/student/change-password', label: '修改密码' },
      ],
    },
    {
      id: 'question',
      title: '试题管理',
      adminOnly: true,
      items: [
        { to: '/admin/questions', label: '试题管理' },
        { to: '/admin/questions/new', label: '添加试题' },
        { to: '/admin/question-import', label: '导入试题' },
      ],
    },
    {
      id: 'paper',
      title: '试卷管理',
      adminOnly: true,
      items: [
        { to: '/admin/exam-papers', label: '试卷列表' },
        { to: '/admin/exam-papers/new', label: '添加试卷' },
      ],
    },
    {
      id: 'member',
      title: '成员管理',
      adminOnly: true,
      items: [
        { to: '/admin/user-list', label: '成员管理', matchPaths: ['/admin/users', '/admin/user-list'] },
        { to: '/admin/add-user', label: '添加成员' },
      ],
    },
    {
      id: 'field',
      title: '题库管理',
      adminOnly: true,
      items: [
        { to: '/admin/field-list-1', label: '题库列表', matchPaths: ['/admin/fields', '/admin/field-list-1'] },
        { to: '/admin/add-field', label: '添加题库' },
        { to: '/admin/point-list/1', label: '知识类列表', matchPaths: ['/admin/points/1', '/admin/point-list/1'] },
        { to: '/admin/add-point', label: '添加知识类' },
        { to: '/admin/answer-stage-list', label: '答题人阶段列表', matchPaths: ['/admin/answer-stages', '/admin/answer-stage-list'] },
        { to: '/admin/add-answer-stage', label: '添加答题人阶段' },
      ],
    },
    {
      id: 'system',
      title: '网站设置',
      adminOnly: true,
      items: [
        { to: '/admin/sys-backup', label: '数据备份' },
        { to: '/admin/sys-admin-list', label: '管理员列表' },
        { to: '/admin/add-admin', label: '添加管理员' },
      ],
    },
  ].filter((group) => (group.adminOnly ? isAdmin : true));

  function isItemActive(item: NavItem) {
    const matchPaths = item.matchPaths || [item.to];
    return matchPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  }

  const activeGroupId =
    navGroups.find((group) => group.items.some((item) => isItemActive(item)))?.id || null;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.id, group.id === activeGroupId])),
  );

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    setOpenGroups((current) => ({ ...current, [activeGroupId]: true }));
  }, [activeGroupId]);

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  }

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <Link to="/home" className="brand-mark">
          <span className="brand-mark__glow" />
          <span>研发部题库</span>
        </Link>
        <nav className="shell-nav">
          <NavLink to="/home" end>
            工作台
          </NavLink>
          {navGroups.map((group) => {
            const isOpen = openGroups[group.id];
            const isGroupActive = group.id === activeGroupId;
            return (
              <div
                key={group.id}
                className={`shell-nav__group${isOpen ? ' is-open' : ''}${isGroupActive ? ' is-active' : ''}`}
              >
                <button type="button" className="shell-nav__trigger" onClick={() => toggleGroup(group.id)}>
                  <span>{group.title}</span>
                  <span className="shell-nav__chevron" aria-hidden="true">
                    ▾
                  </span>
                </button>
                <div className="shell-nav__items">
                  {group.items.map((item) => (
                    <Link key={item.to} to={item.to} className={isItemActive(item) ? 'active' : undefined}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="shell-main">
        <header className="shell-header">
          <div>
            <p className="eyebrow">ExamXX Frontend</p>
            <h1>{user?.trueName || user?.username || '研发部题库'}</h1>
          </div>
          <div className="header-actions">
            <div className="user-badge">
              <span>{user?.rolesName || '成员'}</span>
              <strong>{user?.username}</strong>
            </div>
            <button className="ghost-button" onClick={() => void onLogout()}>
              退出登录
            </button>
          </div>
        </header>
        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
