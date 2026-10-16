import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { AuthUser } from '../types';
import { isAdmin as hasAdminRole, isSuperAdmin } from '../permissions';
import { displayAccount } from '../identity';
import seavoLogo from '../assets/seavo-logo.svg';

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

const OPEN_GROUPS_KEY = 'appshell-open-groups';
const COLLAPSED_KEY = 'appshell-collapsed';

export function AppShell({ children, user, onLogout }: AppShellProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const isAdmin = hasAdminRole(user);
  const sidebarRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    try { if (sidebarRef.current) sidebarRef.current.scrollTop = Number(sessionStorage.getItem('appshell-scroll') || 0); } catch { /* storage unavailable */ }
  }, []);
  const navGroups = [
    {
      id: 'learning',
      title: '学习中心',
      items: [
        { to: '/student/user-center', label: '成员中心' },
        { to: '/student/practice', label: '强化练习' },
        { to: '/student/exam-papers', label: '参加考试', matchPaths: ['/student/exam-papers', '/student/exam'] },
        { to: '/student/analysis', label: '学习分析' },
        { to: '/student/exam-history', label: '考试历史', matchPaths: ['/student/exam-history', '/student/exam-report'] },
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
        { to: '/admin/fields', label: '题库列表', matchPaths: ['/admin/fields', '/admin/field-list-1', '/admin/add-field'] },
        { to: '/admin/points/1', label: '知识类列表', matchPaths: ['/admin/points', '/admin/point-list', '/admin/add-point'] },
        { to: '/admin/answer-stages', label: '答题人阶段列表', matchPaths: ['/admin/answer-stages', '/admin/answer-stage-list', '/admin/add-answer-stage'] },
      ],
    },
    {
      id: 'system',
      title: '超级管理员设置',
      superOnly: true,
      adminOnly: true,
      items: [
        { to: '/admin/sys-backup', label: '数据备份' },
        { to: '/admin/sys-admin-list', label: '管理员列表' },
        { to: '/admin/add-admin', label: '添加管理员' },
      ],
    },
  ].filter((group) => group.superOnly ? isSuperAdmin(user) : group.adminOnly ? isAdmin : true);

  function isItemActive(item: NavItem) {
    const score = (candidate: NavItem) => Math.max(-1, ...(candidate.matchPaths || [candidate.to])
      .filter((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
      .map((path) => path.length));
    const currentScore = score(item);
    return currentScore >= 0 && !navGroups.some((group) => group.items.some((other) => score(other) > currentScore));
  }

  const activeGroupId =
    navGroups.find((group) => group.items.some((item) => isItemActive(item)))?.id || null;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = window.sessionStorage.getItem(OPEN_GROUPS_KEY);
      if (saved) {
        const restored = JSON.parse(saved) as Record<string, boolean>;
        return activeGroupId ? { ...restored, [activeGroupId]: true } : restored;
      }
    } catch {
      /* ignore */
    }
    return Object.fromEntries(navGroups.map((group) => [group.id, group.id === activeGroupId]));
  });

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    setOpenGroups((current) => {
      const next = { ...current, [activeGroupId]: true };
      try {
        window.sessionStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [activeGroupId]);

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => {
      const next = { ...current, [groupId]: !current[groupId] };
      try {
        window.sessionStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className={`shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="shell-sidebar" ref={sidebarRef} onScroll={(event) => {
        try { sessionStorage.setItem('appshell-scroll', String(event.currentTarget.scrollTop)); } catch { /* storage unavailable */ }
      }}>
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
                <button type="button" className="shell-nav__trigger" aria-expanded={Boolean(isOpen)} aria-controls={`nav-${group.id}`} onClick={() => toggleGroup(group.id)}>
                  <span>{group.title}</span>
                  <span className="shell-nav__chevron" aria-hidden="true">
                    ▾
                  </span>
                </button>
                <div className="shell-nav__items-wrap" id={`nav-${group.id}`} {...(!isOpen ? { inert: '' } : {})}><div className="shell-nav__items">
                  {group.items.map((item) => (
                    <Link key={item.to} to={item.to} className={isItemActive(item) ? 'active' : undefined}>
                      {item.label}
                    </Link>
                  ))}
                </div></div>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="shell-main">
        <header className="shell-header">
          <div className="header-title-block">
            <button
              type="button"
              className="ghost-button shell-collapse-button"
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              onClick={() =>
                setCollapsed((current) => {
                  const next = !current;
                  try {
                    window.sessionStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
                  } catch {
                    /* ignore */
                  }
                  return next;
                })
              }
            >
              {collapsed ? '☰' : '‹'}
            </button>
            <div>
              <div className="header-brand"><img src={seavoLogo} alt="SEAVO" /></div>
              <h1>{user?.trueName || displayAccount(user?.username)}</h1>
            </div>
          </div>
          <div className="header-actions">
            <div className="user-badge">
              <span>{user?.rolesName || '成员'}</span>
              <strong>{displayAccount(user?.username)}</strong>
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
