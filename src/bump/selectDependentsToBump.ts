import { BumpDeps, BumpInfo } from '../types/BumpInfo';
import { ChangeType } from '../types/ChangeInfo';
import { PackageDeps } from '../types/PackageInfo';

/**
 * Select dependents for all changed packages that meet bumpDepsCriteria
 */
 export function selectDependentsToBump(bumpInfo: BumpInfo, bumpDeps: BumpDeps): void {
  const { changeFileChangeInfos } = bumpInfo;

  for (const [_, changeInfo] of changeFileChangeInfos.entries()) {
    shouldBumpDependentPackages(bumpDeps, changeInfo.type) && setPackageDependentsInBumpInfo(bumpInfo, changeInfo.packageName)
  }
}

/**
 * Determine if dependents of a package with given change type should be bumped
 *
 * The following logic applies when bumping dependencies:
 * 1. bumpDeps: true - all dependents are bumped
 * 2. bumpDeps: false - no dependents are bumped
 * 3. bumpDeps: {} - assume same behavior as bumpDeps: false (?)
 * 4. bumpDeps: { bumpTo: ChangeType } - bump all dependents for packages with the specified Semver change type or higher.
 *    - bumpDeps: { bumpTo: 'major' } - bump all dependents for packages with a major change type only
 *    - bumpDeps: { bumpTo: 'minor' } - bump all dependents for packages with a major or minor change type
 *    - bumpDeps: { bumpTo: 'patch' } - bump all dependents for packages with a major, minor or patch change type
 *    - bumpDeps: { bumpTo: 'prerelease' } - bump all dependents for packages with a major, minor, patch or prerelease change type
 * 5. bumpDeps: { bumpTo: 'none' } - assume same behavior as bumpDeps: true
 * 6. recursion of bumping dependents stops based on the same bumpDeps rule above
 */
 export function shouldBumpDependentPackages(bumpDeps: BumpDeps, changeType: ChangeType): boolean {
  if (typeof bumpDeps === 'boolean') {
    return bumpDeps;
  }

  const { bumpTo } = bumpDeps;

  // 'prerelease' | 'patch' | 'minor' | 'major' | 'none'

  if (bumpTo === undefined) {
    return false;
  }

  switch (bumpTo) {
    case 'major':
      return changeType === 'major';
    case 'minor':
      return changeType in ['major', 'minor'];
    case 'patch':
      return changeType in ['major', 'minor', 'patch'];
    case 'prerelease':
      return changeType in ['major', 'minor', 'patch', 'prerelease'];
    case 'none':
      return true;
  }
}

/**
 * Gets dependents for a package *
 * Example: "BigApp" deps on "SomeUtil", "BigApp" would be the dependent
 */
 export function setPackageDependentsInBumpInfo(bumpInfo: BumpInfo, packageName: string): void {
  const { packageInfos, scopedPackages } = bumpInfo;
  const dependents: BumpInfo['dependents'] = bumpInfo.dependents;


  if (!scopedPackages.has(packageName)) {
    return;
  }

  const info = packageInfos[packageName];
  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];

  depTypes.forEach(depType => {
    const deps: PackageDeps | undefined = (info as any)[depType];
    if (deps) {
      for (let dep of Object.keys(deps)) {
        if (Object.keys(packageInfos).includes(dep)) {
          dependents[dep] = dependents[dep] || [];
          if (!dependents[dep].includes(packageName)) {
            dependents[dep].push(packageName);
          }
        }
      }
    }
  });

  bumpInfo.dependents = dependents;
}
