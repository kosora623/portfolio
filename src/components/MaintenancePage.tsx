export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl text-neutral-200 mb-4">KSR</h1>
        <p className="text-neutral-400 leading-loose text-sm">
          ただいまサイトを改修しています。
          <br />
          しばらくお待ちください。
        </p>
        <p className="mt-8 text-neutral-500 text-sm">
          ご連絡は{' '}
          <a
            href="mailto:contact@kosora623.com"
            className="text-neutral-300 underline underline-offset-4 decoration-neutral-600 hover:decoration-neutral-300"
          >
            contact@kosora623.com
          </a>{' '}
          まで。
        </p>
      </div>
    </div>
  );
}
