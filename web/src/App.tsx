import { useAuthContext } from "@asgardeo/auth-react";
import ChatView from "./components/ChatView";
import LoginPage from "./components/LoginPage";
import Header from "./components/Header";

function App() {
  const { state, signOut } = useAuthContext();

  // Show loading while the SDK initialises or processes the auth callback redirect
  const hasAuthCallbackParams = new URLSearchParams(window.location.search).has("code");

  if (state.isLoading || hasAuthCallbackParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSignOut={() => signOut()} />
      <ChatView />
    </div>
  );
}

export default App;
