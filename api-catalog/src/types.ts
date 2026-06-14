export type ApiRecord = {
  name: string;
  slug: string;
  category?: string;
  description?: string;
  homepage_url?: string;
  docs_url?: string;
  provider?: string;
  auth_type?: string;
  pricing_notes?: string;
  tags?: string[];
  source_repo_path?: string;
};
