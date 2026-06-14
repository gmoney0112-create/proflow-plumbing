import 'dotenv/config';
import path from 'path';
import { ensureRepo } from './git';
import { parseRepoToApis } from './parse';
import { upsertApis } from './supabase';

async function main(): Promise<void> {
  const repoDir = process.env.GIT_REPO_DIR || './tmp/API-mega-list';
  const repoUrl =
    process.env.GIT_REPO_URL ||
    'https://github.com/cporter202/API-mega-list.git';

  await ensureRepo(repoDir, repoUrl);

  const apis = parseRepoToApis(path.resolve(repoDir));
  console.log(`Parsed ${apis.length} APIs`);

  await upsertApis(apis);
  console.log('Ingestion complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
