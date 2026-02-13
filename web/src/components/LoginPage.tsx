import { useAuthContext } from "@asgardeo/auth-react";

export default function LoginPage() {
  const { signIn } = useAuthContext();

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
      {/* Full-page background image */}
      <img
        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content card floating over background */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        {/* Left — info panel */}
        <div className="bg-indigo-600/90 backdrop-blur-md p-10 lg:p-14 flex flex-col justify-center text-white">
          {/* House icon */}
          <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mb-8">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
            </svg>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            Find your perfect
            <br />
            property in the US
          </h2>
          <p className="text-indigo-100 text-base lg:text-lg leading-relaxed">
            Search thousands of listings across all 50 states. Whether you're
            looking for a short-term stay, a long-term rental, or your dream
            home to buy.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 space-y-4">
            {[
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", text: "Search by state, city, or property type" },
              { icon: "M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7l9-4 9 4", text: "Short & long-term rentals available" },
              { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Verified listings with detailed info" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="text-sm text-indigo-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sign-in panel */}
        <div className="bg-white/90 backdrop-blur-md p-10 lg:p-14 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 mb-8">Sign in to access US Property Search</p>

          <button
            onClick={() => signIn()}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-3 px-6 rounded-xl font-medium text-base hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Secure login</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="mt-6 flex items-center gap-2 justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs">
              Protected with OAuth 2.0 &amp; PKCE
            </span>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Powered by{" "}
            <span className="font-medium text-gray-500">Asgardeo</span>
            {" "}&middot; WSO2 Identity
          </p>
        </div>
      </div>
    </div>
  );
}
