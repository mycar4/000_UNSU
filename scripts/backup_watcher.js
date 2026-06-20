const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths dynamically resolved using the system home directory
const WATCH_DIR = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');
const BACKUP_DIR = path.resolve(__dirname, '..', 'z_history');

// Targets to watch
const TARGET_FILES = [
  'implementation_plan.md',
  'walkthrough.md',
  'detail_functional_spec.md',
  'business_operations_workflow.md',
  'task.md',
  'transcript.jsonl'
];

console.log(`[Watcher] Starting artifact backup watcher...`);
console.log(`[Watcher] Watching directory: ${WATCH_DIR}`);
console.log(`[Watcher] Backup directory: ${BACKUP_DIR}`);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Map to handle debouncing
const debouncers = new Map();

function getTimestamp() {
  const date = new Date();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${mm}${dd}${hh}${min}`;
}

function handleFileChange(fullPath, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename);
  
  if (!TARGET_FILES.includes(base)) return;
  
  // Debounce logic to avoid writing partially-saved files
  if (debouncers.has(fullPath)) {
    clearTimeout(debouncers.get(fullPath));
  }
  
  const timer = setTimeout(() => {
    try {
      if (!fs.existsSync(fullPath)) return;
      
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) return;

      // Read content
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content || content.trim().length === 0) return;

      let backupFilename = '';
      let targetFolder = BACKUP_DIR;

      if (base === 'transcript.jsonl') {
        // Chat logs backup redirection
        const timestamp = getTimestamp();
        backupFilename = `chat_log_${timestamp}.jsonl`;
        targetFolder = path.join(BACKUP_DIR, 'chat_logs');
      } else {
        // Markdown artifacts backup
        const nameWithoutExt = path.basename(base, ext);
        const timestamp = getTimestamp();
        backupFilename = `${nameWithoutExt}${timestamp}${ext}`;
      }

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const backupPath = path.join(targetFolder, backupFilename);

      // Save backup copy
      fs.writeFileSync(backupPath, content, 'utf8');
      console.log(`[Backup Success] ${base} -> ${backupFilename}`);
    } catch (err) {
      console.error(`[Backup Error] Failed to backup ${filename}:`, err.message);
    } finally {
      debouncers.delete(fullPath);
    }
  }, 500); // 500ms debounce delay
  
  debouncers.set(fullPath, timer);
}

// Start recursive filesystem watch
try {
  fs.watch(WATCH_DIR, { recursive: true }, (eventType, relativePath) => {
    if (!relativePath) return;
    
    const fullPath = path.join(WATCH_DIR, relativePath);
    const filename = path.basename(relativePath);
    
    handleFileChange(fullPath, filename);
  });
  console.log(`[Watcher] Successfully initialized. Watching for changes...`);
} catch (err) {
  console.error(`[Watcher Error] Failed to start fs.watch on ${WATCH_DIR}:`, err.message);
}
