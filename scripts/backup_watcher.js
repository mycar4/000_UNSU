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

// Keep only the N latest backup copies in the target directory to prevent clutter
function cleanupOldBackups(targetFolder, prefix, ext, maxFiles = 5) {
  try {
    if (!fs.existsSync(targetFolder)) return;

    const files = fs.readdirSync(targetFolder);
    const backups = files.filter(f => {
      if (prefix === 'chat_log_') {
        return f.startsWith('chat_log_') && f.endsWith('.jsonl');
      }
      const baseName = path.basename(f, ext);
      // Ensure it's a timestamped copy (e.g. walkthrough06202235.md) and not the original
      return f.startsWith(prefix) && f.endsWith(ext) && f !== `${prefix}${ext}`;
    });

    if (backups.length <= maxFiles) return;

    // Sort backups alphabetically to order by sequential MMDDHHMM timestamp
    backups.sort();

    // Delete older files, leaving only the maxFiles newest ones
    const filesToDelete = backups.slice(0, backups.length - maxFiles);
    for (const file of filesToDelete) {
      const filePath = path.join(targetFolder, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted old backup file: ${file}`);
      }
    }
  } catch (err) {
    console.error(`[Cleanup Error] Failed to run garbage collection on ${prefix}:`, err.message);
  }
}

// Retrieve the content of the most recent backup copy to check for modifications
function getLatestBackupContent(base, targetFolder) {
  try {
    if (!fs.existsSync(targetFolder)) return null;

    const files = fs.readdirSync(targetFolder);
    const ext = path.extname(base);
    const prefix = path.basename(base, ext);

    const backups = files.filter(f => {
      if (base === 'transcript.jsonl') {
        return f.startsWith('chat_log_') && f.endsWith('.jsonl');
      }
      return f.startsWith(prefix) && f.endsWith(ext) && f !== base;
    });

    if (backups.length === 0) return null;

    // Sort backups alphabetically to get the latest by sequential timestamp (MMDDHHMM)
    backups.sort();
    const latestBackupFile = backups[backups.length - 1];
    const latestBackupPath = path.join(targetFolder, latestBackupFile);

    if (fs.existsSync(latestBackupPath)) {
      return fs.readFileSync(latestBackupPath, 'utf8');
    }
  } catch (err) {
    console.error(`[Watcher Error] Failed to scan latest backup for ${base}:`, err.message);
  }
  return null;
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
      let nameWithoutExt = '';

      if (base === 'transcript.jsonl') {
        targetFolder = path.join(BACKUP_DIR, 'chat_logs');
      } else {
        nameWithoutExt = path.basename(base, ext);
      }

      // Check if content is actually modified compared to the latest backup
      const latestBackupContent = getLatestBackupContent(base, targetFolder);
      if (latestBackupContent !== null && latestBackupContent === content) {
        // Content is identical, skip backup to prevent duplicates
        return;
      }

      // Generate backup filename if changes detected
      const timestamp = getTimestamp();
      if (base === 'transcript.jsonl') {
        backupFilename = `chat_log_${timestamp}.jsonl`;
      } else {
        backupFilename = `${nameWithoutExt}${timestamp}${ext}`;
      }

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const backupPath = path.join(targetFolder, backupFilename);

      // Save backup copy
      fs.writeFileSync(backupPath, content, 'utf8');
      console.log(`[Backup Success] Content changed. Created backup: ${backupFilename}`);

      // Run automatic retention cleanup
      if (base === 'transcript.jsonl') {
        // Keep only the latest 5 chat logs
        cleanupOldBackups(targetFolder, 'chat_log_', '.jsonl', 5);
      } else {
        // Keep only the latest 5 copies for each markdown artifact
        cleanupOldBackups(targetFolder, nameWithoutExt, ext, 5);
      }
    } catch (err) {
      console.error(`[Backup Error] Failed to backup ${filename}:`, err.message);
    } finally {
      debouncers.delete(fullPath);
    }
  }, 500); // 500ms debounce delay

  debouncers.set(fullPath, timer);
}

// Clean up existing backups on startup to prevent accumulation
function cleanAllOnStartup() {
  console.log('[Watcher] Running startup cleanup...');
  // Clean up chat logs
  const chatLogsFolder = path.join(BACKUP_DIR, 'chat_logs');
  cleanupOldBackups(chatLogsFolder, 'chat_log_', '.jsonl', 5);

  // Clean up markdown artifacts
  TARGET_FILES.forEach(file => {
    if (file === 'transcript.jsonl') return;
    const ext = path.extname(file);
    const prefix = path.basename(file, ext);
    cleanupOldBackups(BACKUP_DIR, prefix, ext, 5);
  });
}

// Start recursive filesystem watch
try {
  // Run startup cleanup immediately
  cleanAllOnStartup();

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

// Global exception guard to prevent watcher from crashing
process.on('uncaughtException', (err) => {
  console.error(`[Watcher Uncaught Exception]: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Watcher Unhandled Rejection]:', reason);
});

// Keep the event loop alive indefinitely
setInterval(() => {}, 1000 * 60 * 60);
