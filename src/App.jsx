import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Participants from "./pages/Participants";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/participants" element={<Participants />} />
        <Route path="/notifications" element={<Notifications />} />
        
      </Route>
    </Routes>
  );
}

export default App;

