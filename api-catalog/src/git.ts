import simpleGit from 'simple-git';
import fs from 'fs';

export async function ensureRepo(localPath: string, remoteUrl: string): Promise<void> {
  if (!fs.existsSync(localPath)) {
    console.log(`Cloning ${remoteUrl} into ${localPath}...`);
    await simpleGit().clone(remoteUrl, localPath);
  } else {
    console.log(`Pulling latest changes in ${localPath}...`);
    const git = simpleGit({ baseDir: localPath });
    await git.pull();
  }
}
