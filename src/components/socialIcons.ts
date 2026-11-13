import type { IconType } from 'react-icons';
import { FaEnvelope, FaGithub, FaYoutube, FaTwitter, FaPlayCircle } from 'react-icons/fa';
import type { SocialIconKey } from '@/data/site';

/** src/data/site.ts のアイコンキー → react-icons コンポーネント */
export const socialIcons: Record<SocialIconKey, IconType> = {
  email: FaEnvelope,
  github: FaGithub,
  youtube: FaYoutube,
  twitter: FaTwitter,
  play: FaPlayCircle,
};
