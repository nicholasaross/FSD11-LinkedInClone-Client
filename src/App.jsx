import "./App.css";
import { Navigate, Route, Routes } from "react-router";
import AppNavbar from "./components/AppNavbar";
import Feed from "./pages/Feed";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PersonProfile from "./pages/PersonProfile";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import { useAuth } from "./context/AuthContext";

function App() {
  const { token } = useAuth();

  return (
    <>
      <AppNavbar />
      <Routes>
        {/* the auth pages bounce signed-in users home, and "/" bounces
            signed-out users to the login form */}
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/" replace /> : <Signup />}
        />
        <Route
          path="/"
          element={token ? <Landing /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/feed"
          element={token ? <Feed /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" replace />}
        />
        {/* everybody else's page. it ranks above the catch-all below, and
            bounces back to "/profile" when the id turns out to be your own */}
        <Route
          path="/profile/:id"
          element={token ? <PersonProfile /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
