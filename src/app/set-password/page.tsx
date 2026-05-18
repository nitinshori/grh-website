import { SetPasswordClient } from "./SetPasswordClient";

export const metadata = {
  title: "Set your password — Get Real Health",
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string }>;
}) {
  const { uid, token } = await searchParams;

  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set your password</h1>
        <p className="text-sm text-gray-600 mb-6">
          You've been invited to the Get Real Health PGD platform. Set a password to finish creating your account.
        </p>
        {!uid || !token ? (
          <p className="text-sm text-red-600">Invalid link — please ask your pharmacy admin to resend the invite.</p>
        ) : (
          <SetPasswordClient uid={uid} token={token} />
        )}
      </div>
    </div>
  );
}
