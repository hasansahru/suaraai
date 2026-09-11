const { execSync } = require('child_process');
const opts = { cwd: 'C:/Users/umiro/.antigravity-ide/suaraai', encoding: 'utf8' };

try {
  console.log('Configuring git user...');
  execSync('git config user.name "SuaraAI Dev"', opts);
  execSync('git config user.email "dev@suara.ai"', opts);
  
  console.log('Adding files...');
  console.log(execSync('git add .', opts));
  console.log('Committing...');
  console.log(execSync('git commit -m "fix: timestamp hallucination automatic matching and safeguards"', opts));
  console.log('Pushing...');
  console.log(execSync('git push origin main', opts));
  console.log('SUCCESS!');
} catch (e) {
  console.error('ERROR:', e.message);
  if (e.stdout) console.log(e.stdout);
  if (e.stderr) console.log(e.stderr);
}

