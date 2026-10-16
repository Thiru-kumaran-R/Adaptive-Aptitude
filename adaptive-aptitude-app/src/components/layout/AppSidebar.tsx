// src/components/layout/AppSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Zap,
  AlertTriangle,
  RotateCcw,
  FileText,
  BarChart2,
  Bot,
  Settings,
} from 'lucide-react';
import styles from '../../styles/layout.module.css';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/agenda', label: 'Daily Agenda', icon: CalendarCheck },
  { to: '/app/practice', label: 'Practice Catalog', icon: BookOpen },
  { to: '/app/adaptive', label: 'Adaptive Practice', icon: Zap },
  { to: '/app/mistakes', label: 'Mistakes Notebook', icon: AlertTriangle },
  { to: '/app/revision', label: 'Revision Queue', icon: RotateCcw },
  { to: '/app/mock-exams', label: 'Mock Exams', icon: FileText },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/app/tutor', label: 'AI Tutor', icon: Bot },
  { to: '/app/profile', label: 'Settings', icon: Settings },
];

export const AppSidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar} aria-label="Sidebar navigation">
      <nav className={styles.sidebarNav} aria-label="Sidebar navigation">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <IconComponent size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
