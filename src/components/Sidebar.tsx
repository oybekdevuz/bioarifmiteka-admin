import { NavLink, useMatch, useNavigate } from "react-router-dom";
import logoSm from "../assets/images/logo-sm.svg";
import { useAuthStore } from "../store/auth";
import { useSidebarStore } from "../store/sidebar";

interface Item {
  to: string;
  label: string;
  icon: string;
}

function SidebarItem({ item }: { item: Item }) {
  const isRoot = item.to === "/";
  const match = useMatch({ path: isRoot ? "/" : `${item.to}/*`, end: isRoot });
  const isActive = !!match;
  return (
    <li className={isActive ? "mm-active" : ""}>
      <NavLink
        to={item.to}
        end={isRoot}
        className={isActive ? "active waves-effect" : "waves-effect"}
        title={item.label}
      >
        <i className={`bx ${item.icon}`} />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

const items: Item[] = [
  { to: "/", label: "Bosh sahifa", icon: "bx-home-circle" },
  { to: "/users", label: "Foydalanuvchilar", icon: "bx-user" },
  { to: "/plans", label: "Tariflar", icon: "bx-purchase-tag" },
  { to: "/settings", label: "Sozlamalar", icon: "bx-cog" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { collapsed, toggle } = useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="vertical-menu d-flex flex-column">
      <div className="navbar-brand-box d-flex align-items-center justify-content-between position-relative">
        <a href="/" className="logo logo-dark">
          <span className="logo-sm">
            <img src={logoSm} alt="logo" height="22" />
          </span>
          <span className="logo-lg ms-2 fw-bold">Bioarifmetika</span>
        </a>
        <a href="/" className="logo logo-light">
          <span className="logo-sm">
            <img src={logoSm} alt="logo" height="22" />
          </span>
          <span className="logo-lg ms-2 fw-bold">Bioarifmetika</span>
        </a>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Sidebarni ochish" : "Sidebarni yopish"}
          title={collapsed ? "Sidebarni ochish" : "Sidebarni yopish"}
          className="btn btn-sm btn-light border-0 sidebar-toggle-btn"
          style={{
            position: "absolute",
            right: collapsed ? "50%" : "8px",
            top: "50%",
            transform: collapsed ? "translate(50%, -50%)" : "translateY(-50%)",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <i
            className={`bx ${collapsed ? "bx-chevron-right" : "bx-chevron-left"}`}
            style={{ fontSize: 20 }}
          />
        </button>
      </div>
      <div data-simplebar className="flex-grow-1">
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            {items.map((item) => (
              <SidebarItem key={item.to} item={item} />
            ))}
          </ul>
        </div>
      </div>
      {!collapsed && (
        <div className="sidebar-footer border-top p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-soft-danger w-100 d-flex align-items-center justify-content-center gap-2"
          >
            <i className="mdi mdi-logout font-size-18" />
            <span>Chiqish</span>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="sidebar-footer border-top p-2">
          <button
            type="button"
            onClick={handleLogout}
            title="Chiqish"
            className="btn btn-soft-danger w-100 d-flex align-items-center justify-content-center"
            style={{ padding: "8px 0" }}
          >
            <i className="mdi mdi-logout font-size-18" />
          </button>
        </div>
      )}
    </div>
  );
}
