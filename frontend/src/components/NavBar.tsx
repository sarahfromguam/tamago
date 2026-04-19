import { NavLink } from "react-router-dom";

function FriendsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-2a5 5 0 015-5h2a5 5 0 015 5v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 20v-2a4 4 0 00-3-3.87" />
    </svg>
  );
}

export default function NavBar() {
  const base = "flex flex-col items-center gap-1 px-7 py-2.5 text-[10px] font-bold tracking-wide transition-all duration-200";
  const active = "text-[#f5c060]";
  const inactive = "text-white/40 hover:text-white/65";

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5">
      <div
        className="pointer-events-auto flex overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #4d2e16 0%, #3a2010 100%)",
          boxShadow: "0 8px 32px rgba(40,16,4,0.28), 0 2px 8px rgba(40,16,4,0.2), inset 0 1px 0 rgba(255,200,100,0.12)",
          border: "1px solid rgba(120,70,30,0.5)",
        }}
      >
        <NavLink to="/home" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <FriendsIcon />
          <span>Friends</span>
        </NavLink>

        {/* Divider */}
        <div className="my-2.5 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        <NavLink to="/my" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <img src="/eggs/fried.png" alt="" className="h-5 w-5 object-contain" style={{ filter: "drop-shadow(0 0 3px rgba(245,192,96,0))" }} />
          <span>My Tamago</span>
        </NavLink>
      </div>
    </nav>
  );
}
