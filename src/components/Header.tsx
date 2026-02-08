import { useEffect, useState } from "react";
import { useAuthContext, type DecodedIDTokenPayload } from "@asgardeo/auth-react";

export default function Header() {
  const { signOut, getDecodedIDToken } = useAuthContext();
  const [idToken, setIdToken] = useState<DecodedIDTokenPayload | null>(null);

  useEffect(() => {
    getDecodedIDToken().then(setIdToken).catch(() => {});
  }, [getDecodedIDToken]);

  const givenName = idToken?.given_name as string | undefined;
  const familyName = idToken?.family_name as string | undefined;
  const displayName = givenName
    ? familyName ? `${givenName} ${familyName}` : givenName
    : "User";

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            US Property Search
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Browse properties for rent and sale across the United States
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              Hello, {displayName}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
