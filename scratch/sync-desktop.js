import { execSync } from 'child_process';

const source = 'C:\\Users\\kulbhushan\\.gemini\\antigravity-ide\\scratch\\eureka-blog';
const target = 'C:\\Users\\kulbhushan\\OneDrive\\Attachments\\Desktop\\projects\\project 1\\eureka blog';

try {
  console.log('Running robocopy...');
  // Robocopy returns exit codes 0-7 for success/informational
  const cmd = `robocopy "${source}" "${target}" /E /XD node_modules .git scratch`;
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    if (err.status <= 3) {
      console.log('Robocopy completed successfully with status:', err.status);
    } else {
      console.error('Robocopy error status:', err.status);
    }
  }
} catch (e) {
  console.error('Sync failed:', e);
}
