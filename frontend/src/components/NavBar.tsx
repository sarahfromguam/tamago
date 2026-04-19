import { NavLink } from "react-router-dom";

export default function NavBar() {
  const base = "flex flex-col items-center gap-1 text-xs font-semibold transition-colors px-6";
  const active = "text-[#c9856a]";
  const inactive = "text-[#c9a882]/70";

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#e8d8c8]/60 bg-[#fdf8f0]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around py-3">
        <NavLink to="/home" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <span className="text-2xl">&#x1F3E0;</span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/my" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <img src="/eggs/fried.png" alt="My Tamago" className="h-7 w-7 object-contain" />
          <span>My Tamago</span>
        </NavLink>
      </div>
    </nav>
  );
}
