import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@asgardeo/auth-react'
import './index.css'
import App from './App.tsx'

const asgardeoConfig = {
  signInRedirectURL: import.meta.env.VITE_ASGARDEO_SIGN_IN_REDIRECT_URL || "http://localhost:5173",
  signOutRedirectURL: import.meta.env.VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL || "http://localhost:5173",
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID || "",
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL || "",
  scope: ["openid", "profile", "email", "property-test", "list-rent", "list-sale"],
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={asgardeoConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
