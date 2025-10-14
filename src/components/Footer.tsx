import { FaGithub, FaTwitter, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  const socialLinks = [
    { href: 'https://github.com/kosora623', icon: FaGithub },
    { href: 'https://twitter.com/kosora623', icon: FaTwitter },
    { href: 'https://youtube.com/@k0sora623', icon: FaYoutube },
  ];

  return (
    <footer className="py-8 text-center text-slate">
      <div className="container mx-auto px-6">
        <div className="flex justify-center space-x-6 mb-4">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Link to ${link.href}`}
              className="text-2xl transition-all duration-200 transform hover:scale-110 hover:-translate-y-1 hover:text-teal"
            >
              <link.icon />
            </a>
          ))}
        </div>

        <p className="text-sm font-mono">
          2025 Built by kosora
        </p>
      </div>
    </footer>
  );
}