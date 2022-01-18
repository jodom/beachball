import fs from 'fs-extra';
import { getChangesBetweenRefs } from 'workspace-tools';
import { BeachballOptions } from '../types/BeachballOptions';
import { getChangePath } from '../paths';

/**
 * Change file not within the applicable bump range are considered stale and should be flagged by validation
 * The applicable bump range is usually determined by git fromRef or branch option and the current HEAD
 *
 * This validation check warns about change files,
 * and could be used with a configuration option that fails validation in case stale change files are present
 */
export function areChangeFilesStale(options: BeachballOptions): boolean {
  const { path: cwd, branch } = options;
  const changePath = getChangePath(cwd);
  const fromRef = options.fromRef || branch;

  let staleChangeFiles: string[] = [];

  if (changePath && fs.existsSync(changePath)) {
    const allChangeFiles = fs.readdirSync(changePath);

    const changeFilesSinceFromRef = getChangesBetweenRefs(
      fromRef,
      'HEAD',
      [
        '--diff-filter=d', // excluding deleted files from the diff.
        '--relative', // results will include path relative to the cwd, i.e. only file names.
      ],
      '*.json',
      changePath
    );

    staleChangeFiles = allChangeFiles.filter(fileName => !changeFilesSinceFromRef.includes(fileName));
  }

  const changeFilesAreStale = staleChangeFiles.length > 0;

  if (changeFilesAreStale) {
    const changeFiles = staleChangeFiles.map(file => `- ${file}`);
    const errorMessage = 'The following change files are stale:';

    console.error(`${errorMessage}\n${changeFiles.join('\n')}\n`);
  }

  return changeFilesAreStale;
}
