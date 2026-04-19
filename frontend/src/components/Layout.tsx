import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";


export default function Layout() {
  return (
    <div className="min-h-screen font-display">
      {/* Header with logo */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-center py-2">
          <Link to="/home">
            <img
              src="/logo.png"
              alt="Tamago"
              className="h-16 w-auto object-contain drop-shadow-sm"
            />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pb-6 pt-4">
        <Outlet />
      </div>
      <NavBar />
    </div>
  );
}
