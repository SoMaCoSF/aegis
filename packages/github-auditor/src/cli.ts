import { execSync } from 'child_process';

interface GitHubIntegration {
  id: string;
  type: string;
  name: string;
  suspicious: boolean;
  reasons: string[];
}

async function checkAuth(): Promise<boolean> {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function getUser(): Promise<{ login: string }> {
  const result = execSync('gh api user', { encoding: 'utf8' });
  return JSON.parse(result);
}

async function getOAuthApps(): Promise<GitHubIntegration[]> {
  try {
    const result = execSync('gh api /user/installations --paginate', { encoding: 'utf8' });
    const data = JSON.parse(result);
    const installations = data.installations || [];
    
    return installations.map((app: any) => ({
      id: `oauth_${app.id}`,
      type: 'oauth_app',
      name: app.app_slug || 'Unknown',
      suspicious: false,
      reasons: []
    }));
  } catch {
    return [];
  }
}

async function getSSHKeys(): Promise<GitHubIntegration[]> {
  try {
    const result = execSync('gh api /user/keys --paginate', { encoding: 'utf8' });
    const keys = JSON.parse(result);
    
    return keys.map((key: any) => {
      const created = new Date(key.created_at);
      const ageInDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      const suspicious = ageInDays > 365;
      
      return {
        id: `ssh_${key.id}`,
        type: 'ssh_key',
        name: key.title,
        suspicious,
        reasons: suspicious ? ['Key older than 1 year'] : []
      };
    });
  } catch {
    return [];
  }
}

async function main() {
  console.log('🐙 AEGIS GitHub Auditor');
  console.log('=======================\n');
  
  if (!await checkAuth()) {
    console.error('❌ Not authenticated. Run: gh auth login');
    process.exit(1);
  }
  
  const user = await getUser();
  console.log(`👤 Authenticated as: ${user.login}\n`);
  
  console.log('📦 Scanning OAuth apps...');
  const oauthApps = await getOAuthApps();
  console.log(`   Found ${oauthApps.length} OAuth app(s)`);
  
  console.log('🔑 Scanning SSH keys...');
  const sshKeys = await getSSHKeys();
  console.log(`   Found ${sshKeys.length} SSH key(s)`);
  
  const all = [...oauthApps, ...sshKeys];
  const suspicious = all.filter(i => i.suspicious);
  
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(40));
  console.log(`Total integrations: ${all.length}`);
  console.log(`Suspicious: ${suspicious.length}`);
  
  if (suspicious.length > 0) {
    console.log('\n⚠️  SUSPICIOUS:');
    for (const item of suspicious) {
      console.log(`  • ${item.name} (${item.type})`);
      item.reasons.forEach(r => console.log(`    - ${r}`));
    }
  }
  
  console.log('\n✅ Audit complete!');
}

main().catch(console.error);
