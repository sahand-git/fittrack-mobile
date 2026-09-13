import { readFileSync, writeFileSync, rmSync } from 'node:fs';

// CI-only isolated package: never replace an existing user's installation.
const gradlePath = 'android/app/build.gradle';
let gradle = readFileSync(gradlePath, 'utf8');
if (!gradle.includes('applicationId "com.sahand.fittrackv2"')) throw new Error('Unexpected Android application ID');
gradle = gradle.replace('applicationId "com.sahand.fittrackv2"', 'applicationId "com.sahand.fittrackv2.preview"');
gradle = gradle.replace('versionName "1.5.1"', 'versionName "1.6.0-preview"');
writeFileSync(gradlePath, gradle);
const stringsPath = 'android/app/src/main/res/values/strings.xml';
writeFileSync(stringsPath, readFileSync(stringsPath, 'utf8').replaceAll('>Calorie Pewar<', '>Calorie Pewar Preview<'));
// This preview has no configured authentication project. Avoid native auto-init.
rmSync('android/app/google-services.json', { force: true });
