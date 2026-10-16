// src/components/layout/BottomNav.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, BookOpen, BarChart2, Bot } from 'lucide-react';
import styles from '../../styles/layout.module.css';

const MOBILE_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/agenda', label: 'Agenda', icon: CalendarCheck },
  { to: '/app/practice', label: 'Practice', icon: BookOpen },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/app/tutor', label: 'Tutor', icon: Bot },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className={styles.bottomNav} aria-label="Mobile bottom navigation">
      {MOBILE_ITEMS.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
            }
          >
            <IconComponent size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
