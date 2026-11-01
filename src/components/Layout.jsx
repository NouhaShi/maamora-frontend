
import { Outlet, NavLink } from "react-router-dom";
import {
  Users,
  UserRound,
  Bell,
  Settings,
  Home,
  CalendarDays,
} from "lucide-react";

function Layout() {
  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div>
            <div className="logo-title">Maamora</div>
            <div className="logo-subtitle">GROUP MONITOR</div>
          </div>
        </div>

        <nav className="navigation">
          <NavLink to="/dashboard" className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }>
            <Home className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/groups" className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }>
            <Users className="nav-icon" />
            <span>Groups</span>
          </NavLink>

          <NavLink to="/participants" className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }>
            <UserRound className="nav-icon" />
            <span>Participants</span>
          </NavLink>

          <NavLink to="/notifications" className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }>
            <Bell className="nav-icon" />
            <span>Notifications</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item">
            <Settings className="nav-icon" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        <header className="top-header">
          <div className="search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search groups, participants..."
            />
          </div>

          <div className="user-area">
            <div className="notification-bell">
              🔔
            </div>
            <div className="avatar">A</div>
            <div className="admin">
              <strong>Admin</strong>
              <span>⌄</span>
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
