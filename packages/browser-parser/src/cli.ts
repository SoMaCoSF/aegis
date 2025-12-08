import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CHROME_PATH = process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')
  : path.join(os.homedir(), '.config', 'google-chrome');

const EDGE_PATH = process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'User Data')
  : path.join(os.homedir(), '.config', 'microsoft-edge');

interface BrowserProfile {
  browser: string;
  profile: string;
  loginDataPath: string;
  historyPath: string;
}

function findProfiles(): BrowserProfile[] {
  const profiles: BrowserProfile[] = [];
  
  const browsers = [
    { name: 'Chrome', path: CHROME_PATH },
    { name: 'Edge', path: EDGE_PATH }
  ];
  
  for (const browser of browsers) {
    if (!fs.existsSync(browser.path)) continue;
    
    // Check Default profile
    const defaultLogin = path.join(browser.path, 'Default', 'Login Data');
    if (fs.existsSync(defaultLogin)) {
      profiles.push({
        browser: browser.name,
        profile: 'Default',
        loginDataPath: defaultLogin,
        historyPath: path.join(browser.path, 'Default', 'History')
      });
    }
    
    // Check numbered profiles
    try {
      const entries = fs.readdirSync(browser.path);
      for (const entry of entries) {
        if (entry.startsWith('Profile ')) {
          const loginPath = path.join(browser.path, entry, 'Login Data');
          if (fs.existsSync(loginPath)) {
            profiles.push({
              browser: browser.name,
              profile: entry,
              loginDataPath: loginPath,
              historyPath: path.join(browser.path, entry, 'History')
            });
          }
        }
      }
    } catch {}
  }
  
  return profiles;
}

async function main() {
  console.log('🌐 AEGIS Browser Parser');
  console.log('=======================\n');
  
  const profiles = findProfiles();
  
  if (profiles.length === 0) {
    console.log('❌ No browser profiles found');
    console.log('   Looking in:');
    console.log(`   - ${CHROME_PATH}`);
    console.log(`   - ${EDGE_PATH}`);
    return;
  }
  
  console.log(`Found ${profiles.length} browser profile(s):\n`);
  
  for (const profile of profiles) {
    console.log(`📁 ${profile.browser} - ${profile.profile}`);
    console.log(`   Login Data: ${fs.existsSync(profile.loginDataPath) ? '✅' : '❌'}`);
    console.log(`   History: ${fs.existsSync(profile.historyPath) ? '✅' : '❌'}`);
    console.log('');
  }
  
  console.log('⚠️  Note: Full password extraction requires Windows DPAPI.');
  console.log('   Run from Windows (not WSL) for password decryption.');
  console.log('\n✅ Scan complete!');
}

main().catch(console.error);
