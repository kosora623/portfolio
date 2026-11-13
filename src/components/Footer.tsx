import { footerSocialLinks } from '@/data/site';
import { socialIcons } from '@/components/socialIcons';

export default function Footer() {
  return (
    <footer className="py-8 text-center text-slate">
      <div className="container mx-auto px-6">
        <div className="flex justify-center space-x-6 mb-4">
          {footerSocialLinks.map((link, index) => {
            const Icon = socialIcons[link.icon];
            return (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Link to ${link.href}`}
                className="text-2xl transition-all duration-200 transform hover:scale-110 hover:-translate-y-1 hover:text-teal"
              >
                <Icon />
              </a>
            );
          })}
        </div>

        <p className="text-sm font-mono">
          2025 Built by kosora
        </p>
      </div>
    </footer>
  );
}