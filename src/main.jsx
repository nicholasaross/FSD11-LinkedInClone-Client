import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { ConnectionsProvider } from './context/ConnectionsProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* inside AuthProvider, since who you are connected to depends on
            who you are: the list is fetched when a token appears and
            dropped when one goes */}
        <ConnectionsProvider>
          <App />
        </ConnectionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
