import { FaEnvelope, FaGithub, FaTwitter, FaYoutube } from 'react-icons/fa';

const links = [
  { name: 'Email', href: 'mailto:contact@kosora623.com', icon: FaEnvelope },
  { name: 'GitHub', href: 'https://github.com/kosora623', icon: FaGithub },
  { name: 'YouTube', href: 'https://youtube.com/@k0sora623', icon: FaYoutube },
  { name: 'Twitter', href: 'https://twitter.com/kosora623', icon: FaTwitter },
];

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <p className="font-mono text-teal-400 text-sm tracking-[0.3em] mb-6">
          UNDER CONSTRUCTION
        </p>

        <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-100 mb-6">
          サイト改修中です
        </h1>

        <p className="text-neutral-400 leading-relaxed mb-10">
          現在、ポートフォリオサイトをリニューアルしています。
          <br />
          公開まで今しばらくお待ちください。
        </p>

        {/* 進捗バー風のアニメーション */}
        <div className="relative h-1 w-full max-w-xs mx-auto bg-neutral-800 rounded-full overflow-hidden mb-12">
          <div className="absolute inset-y-0 w-1/3 bg-teal-400 rounded-full animate-[maintenance-slide_1.6s_ease-in-out_infinite]" />
        </div>

        <ul className="flex justify-center gap-6">
          {links.map(({ name, href, icon: Icon }) => (
            <li key={name}>
              <a
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                aria-label={name}
                className="text-neutral-400 hover:text-teal-400 transition-colors"
              >
                <Icon size={22} />
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-16 font-mono text-xs text-neutral-600">
          © {new Date().getFullYear()} KSR
        </p>
      </div>
    </div>
  );
}
