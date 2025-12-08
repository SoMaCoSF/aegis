export type DataSource = 'chrome' | 'firefox' | 'edge' | 'brave' | 'gmail' | 'protonmail' | 'github' | 'manual';

export type AccountCategory = 
  | 'streaming' | 'saas' | 'productivity' | 'services'
  | 'marketplace' | 'retail' | 'digital_goods'
  | 'banking' | 'payment_processor' | 'crypto'
  | 'social' | 'email' | 'storage' | 'development'
  | 'gaming' | 'news' | 'education' | 'other';

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'unknown';

export interface Account {
  id: string;
  domain: string;
  url?: string;
  username?: string;
  email?: string;
  passwordStored: boolean;
  passwordStrength?: PasswordStrength;
  has2FA: boolean;
  category: AccountCategory;
  source: DataSource;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function categorizeByDomain(domain: string): AccountCategory {
  const d = domain.toLowerCase();
  if (/netflix|spotify|hulu|disney|hbo|youtube|twitch/.test(d)) return 'streaming';
  if (/github|gitlab|bitbucket|npm|docker/.test(d)) return 'development';
  if (/amazon|ebay|alibaba|etsy/.test(d)) return 'marketplace';
  if (/paypal|stripe|venmo|wise/.test(d)) return 'payment_processor';
  if (/facebook|twitter|instagram|linkedin|reddit/.test(d)) return 'social';
  if (/gmail|outlook|proton/.test(d)) return 'email';
  return 'other';
}
