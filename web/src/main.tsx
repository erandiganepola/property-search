import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@asgardeo/auth-react'
import './index.css'
import App from './App.tsx'
import { config } from './config'

const asgardeoConfig = {
  signInRedirectURL: config.asgardeoSignInRedirectUrl,
  signOutRedirectURL: config.asgardeoSignOutRedirectUrl,
  clientID: config.asgardeoClientId,
  baseUrl: config.asgardeoBaseUrl,
  scope: ["openid", "profile", "email", "property-test", "list-rent", "list-sale"],
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={asgardeoConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
