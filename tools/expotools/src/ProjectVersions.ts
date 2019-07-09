import path from 'path';
import fs from 'fs-extra';
import plist from 'plist';
import semver from 'semver';
import JsonFile from '@expo/json-file';

import * as Directories from './Directories';

export type Platform = 'ios' | 'android';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

export async function sdkVersionAsync(): Promise<string> {
  const packageJson = await JsonFile.readAsync(path.join(EXPO_DIR, 'packages/expo/package.json'));
  return packageJson.version as string;
}

export async function iosAppVersionAsync(): Promise<string> {
  const infoPlistPath = path.join(EXPO_DIR, 'ios', 'Exponent', 'Supporting', 'Info.plist');
  const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
  const bundleVersion = infoPlist.CFBundleShortVersionString;

  if (!bundleVersion) {
    throw new Error(`"CFBundleShortVersionString" not found in plist: ${infoPlistPath}`);
  }
  return bundleVersion;
}

export async function getSDKVersionsAsync(platform: Platform): Promise<string[]> {
  if (platform === 'ios') {
    const sdkVersionsPath = path.join(EXPO_DIR, 'exponent-view-template', 'ios', 'exponent-view-template', 'Supporting', 'sdkVersions.json');

    if (await fs.exists(sdkVersionsPath)) {
      const { sdkVersions } = await JsonFile.readAsync(sdkVersionsPath) as { sdkVersions: string[] };
      return sdkVersions;
    }
  }
  // TODO: implementation for Android
  throw new Error(`This task isn't supported on ${platform} yet.`);
}

export async function getOldestSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const sdkVersions = await getSDKVersionsAsync(platform);
  return sdkVersions.sort(semver.compare)[0];
}

export async function getNewestSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const sdkVersions = await getSDKVersionsAsync(platform);
  return sdkVersions.sort(semver.rcompare)[0];
}

export async function getNextSDKVersionAsync(platform: Platform): Promise<string | undefined> {
  const newestVersion = await getNewestSDKVersionAsync(platform);

  if (!newestVersion) {
    return;
  }
  return `${semver.major(semver.inc(newestVersion, 'major'))}.0.0`;
}
