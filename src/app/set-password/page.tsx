import { SetPasswordClient } from "./SetPasswordClient";

export const metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string; mode?: string }>;
}) {
  const { uid, token, mode } = await searchParams;
  const reset = mode === "reset";

  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {reset ? "Choose a new password" : "Set your password"}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {reset
            ? "Enter a new password for your Get Real Health PGD platform account."
            : "You've been invited to the Get Real Health PGD platform. Set a password to finish creating your account."}
        </p>
        {!uid || !token ? (
          <p className="text-sm text-red-600">
            This link has expired or has already been used. Use <a href="/forgot-password" className="underline">Forgotten your password?</a> on the login page to get a new one.
          </p>
        ) : (
          <SetPasswordClient uid={uid} token={token} />
        )}
      </div>
    </div>
  );
}
