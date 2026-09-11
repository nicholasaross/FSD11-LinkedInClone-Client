import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { FaLinkedin } from "react-icons/fa";
import CreatePost from "./CreatePost";
import RestoreSite from "./RestoreSite";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";

function AppNavbar() {
  const { token, currentUser, logout } = useAuth();

  // white and stuck to the top, as on linkedin, where the nav stays put while
  // the feed scrolls under it
  return (
    <Navbar expand="sm" bg="white" sticky="top" className="mb-3">
      <Container fluid>
        <div className="d-flex align-items-center gap-2">
          <Navbar.Brand
            as={Link}
            to="/"
            className="mb-0 d-flex align-items-center gap-2"
          >
            {/* decorative: the wordmark beside it already names the app.
                the mark is the square with the "in" knocked out of it, so the
                letters take the navbar's white rather than being drawn white */}
            <FaLinkedin size={32} className="text-primary" aria-hidden="true" />
            LinkedIn Clone
          </Navbar.Brand>
          {currentUser?.isAdmin && <RestoreSite />}
          {token && (
            <>
              <Button
                as={Link}
                to="/feed"
                variant="primary"
                className="navbar-action-button ms-3"
              >
                Feed
              </Button>
              <Button
                as={Link}
                to="/profile"
                variant="primary"
                className="navbar-action-button"
              >
                Profile
              </Button>
              <CreatePost />
            </>
          )}
        </div>
        {/* logged out there is nothing to collapse, so the toggle goes too */}
        {token && (
          <>
            <Navbar.Toggle aria-controls="main-navbar" />
            <Navbar.Collapse id="main-navbar" className="justify-content-end">
              <Nav className="align-items-sm-center gap-2">
                <Navbar.Text>
                  Signed in as {currentUser?.name ?? currentUser?.username}
                </Navbar.Text>
                <Button variant="outline-secondary" onClick={logout}>
                  Log Out
                </Button>
              </Nav>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
