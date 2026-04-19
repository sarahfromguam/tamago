import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomeFeed from "./pages/HomeFeed";
import MyTamago from "./pages/MyTamago";
import MedLog from "./pages/MedLog";
import FriendDetail from "./pages/FriendDetail";
import AcceptInvite from "./pages/AcceptInvite";
import DemoConsole from "./pages/DemoConsole";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomeFeed />} />
        <Route path="my" element={<MyTamago />} />
        <Route path="meds" element={<MedLog />} />
        <Route path="demo" element={<DemoConsole />} />
        <Route path="t/:slug" element={<FriendDetail />} />
        <Route path="invite/:code" element={<AcceptInvite />} />
      </Route>
    </Routes>
  );
}
