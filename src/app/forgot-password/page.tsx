import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata = {
  title: "Forgotten password | Get Real Health",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgotten your password?</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter the email address you log in with and we will send you a link to choose a new
          password. The link works once and expires after 2 hours.
        </p>
        <ForgotPasswordClient />
      </div>
    </div>
  );
}
