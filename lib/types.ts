export interface Website {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: string;
  description: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  version: number;
  websites: Website[];
  categories: string[];
}

export type SortKey = 'recent' | 'alpha' | 'favorites' | 'category';

export const DEFAULT_CATEGORIES = [
  'AI',
  'Design',
  'Development',
  'Shopify',
  'Social Media',
  'Marketing',
  'Research',
  'Tools',
  'Other',
] as const;

export const FALLBACK_CATEGORY = 'Other';

export const VAULT_STORAGE_KEY = 'my-web-vault:v1';
export const VAULT_VERSION = 1;
