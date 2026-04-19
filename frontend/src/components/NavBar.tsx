import { useState } from "react";
import { NavLink } from "react-router-dom";

function FriendsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-2a5 5 0 015-5h2a5 5 0 015 5v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 20v-2a4 4 0 00-3-3.87" />
    </svg>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const active = "text-[#c47a3a]";
  const inactive = "text-[#6b4c35]/60 hover:text-[#6b4c35]";
  const itemBase = "flex items-center gap-2.5 px-4 py-2.5 font-pixel text-[14px] tracking-wide transition-all duration-150 w-full";

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <nav className="fixed left-3 top-3 z-50">
        <div
          className="overflow-hidden rounded-lg"
          style={{
            background: "rgba(253, 248, 240, 0.92)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(40,16,4,0.12)",
            border: "1px solid rgba(180,140,100,0.25)",
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex flex-col items-center justify-center gap-[5px] px-3 py-3 transition-opacity active:opacity-60"
            aria-label="Menu"
          >
            <span className="block w-4 h-[2px] rounded-full" style={{ background: "#8b6a4a" }} />
            <span className="block w-4 h-[2px] rounded-full" style={{ background: "#8b6a4a" }} />
            <span className="block w-4 h-[2px] rounded-full" style={{ background: "#8b6a4a" }} />
          </button>

          {/* Links */}
          {open && (
            <>
              <div className="mx-3 h-px" style={{ background: "rgba(139,106,74,0.15)" }} />
              <NavLink
                to="/home"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}
              >
                <FriendsIcon />
                <span>Friends</span>
              </NavLink>
              <div className="mx-3 h-px" style={{ background: "rgba(139,106,74,0.15)" }} />
              <NavLink
                to="/my"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}
              >
                <img src="/eggs/joyful.png" alt="" className="h-4 w-4 object-contain" />
                <span>My Tamago</span>
              </NavLink>
              <div className="mx-3 h-px" style={{ background: "rgba(139,106,74,0.15)" }} />
              <NavLink
                to="/demo"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `${itemBase} ${isActive ? active : inactive}`}
              >
                <span className="text-sm">🎙️</span>
                <span>Omi Demo</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
