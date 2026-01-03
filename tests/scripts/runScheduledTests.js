// scripts/runScheduledTests.js
// Script pour exécuter les tests automatiquement à intervalles réguliers

const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Configuration
const CONFIG = {
  // Intervalle de test (cron expression)
  // Par défaut: toutes les 6 heures à 0, 6, 12, 18h
  testSchedule: process.env.TEST_SCHEDULE || '0 */6 * * *',
  
  // Email de notification
  emailEnabled: process.env.EMAIL_ENABLED === 'true',
  emailConfig: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  emailRecipients: (process.env.EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  
  // Répertoire des rapports
  reportsDir: path.join(__dirname, '../reports'),
  
  // Seuils d'alerte
  coverageThreshold: 50,
  maxFailures: 0
};

// Créer le répertoire des rapports
if (!fs.existsSync(CONFIG.reportsDir)) {
  fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
}

/**
 * Exécute les tests et retourne les résultats
 */
async function runTests() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Démarrage des tests automatisés - ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);
    
    exec('npm run test:ci', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      const results = {
        success: !error,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
        stdout,
        stderr,
        error: error ? error.message : null
      };
      
      results.summary = parseTestResults(stdout);
      saveReport(results);
      resolve(results);
    });
  });
}

/**
 * Parse les résultats des tests
 */
function parseTestResults(output) {
  const summary = { total: 0, passed: 0, failed: 0, skipped: 0, coverage: null };
  
  const testMatch = output.match(/Tests:\s+(\d+)\s+passed,?\s*(\d+)?\s*failed?,?\s*(\d+)?\s*skipped?,?\s*(\d+)\s+total/i);
  if (testMatch) {
    summary.passed = parseInt(testMatch[1]) || 0;
    summary.failed = parseInt(testMatch[2]) || 0;
    summary.skipped = parseInt(testMatch[3]) || 0;
    summary.total = parseInt(testMatch[4]) || summary.passed + summary.failed + summary.skipped;
  }
  
  const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
  if (coverageMatch) {
    summary.coverage = parseFloat(coverageMatch[1]);
  }
  
  return summary;
}

/**
 * Sauvegarde le rapport de tests
 */
function saveReport(results) {
  const reportFileName = `test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const reportPath = path.join(CONFIG.reportsDir, reportFileName);
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Rapport sauvegardé: ${reportPath}`);
  
  cleanOldReports();
}

/**
 * Nettoie les anciens rapports (garde les 30 derniers)
 */
function cleanOldReports() {
  const reports = fs.readdirSync(CONFIG.reportsDir)
    .filter(f => f.startsWith('test-report-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(CONFIG.reportsDir, f),
      time: fs.statSync(path.join(CONFIG.reportsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  reports.slice(30).forEach(report => {
    fs.unlinkSync(report.path);
    console.log(`🗑️ Ancien rapport supprimé: ${report.name}`);
  });
}

/**
 * Envoie une notification par email
 */
async function sendEmailNotification(results) {
  if (!CONFIG.emailEnabled || CONFIG.emailRecipients.length === 0) {
    console.log('📧 Notifications email désactivées');
    return;
  }
  
  const transporter = nodemailer.createTransport(CONFIG.emailConfig);
  
  const status = results.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: ${results.success ? '#4CAF50' : '#f44336'}; color: white; padding: 20px; border-radius: 8px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .stat { display: inline-block; margin: 10px 20px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 12px; color: #666; }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${status} - Rapport de Tests Automatisés</h1>
        <p>Date: ${results.timestamp} | Durée: ${results.duration}</p>
      </div>
      
      <div class="summary">
        <h2>📊 Résumé</h2>
        <div class="stat">
          <div class="stat-value">${results.summary.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat">
          <div class="stat-value passed">${results.summary.passed}</div>
          <div class="stat-label">Réussis</div>
        </div>
        <div class="stat">
          <div class="stat-value failed">${results.summary.failed}</div>
          <div class="stat-label">Échoués</div>
        </div>
        ${results.summary.coverage !== null ? `
        <div class="stat">
          <div class="stat-value">${results.summary.coverage}%</div>
          <div class="stat-label">Couverture</div>
        </div>
        ` : ''}
      </div>
      
      ${!results.success ? `
      <div class="details">
        <h2>❌ Détails des erreurs</h2>
        <pre>${results.stderr || results.error || 'Aucun détail'}</pre>
      </div>
      ` : ''}
    </body>
    </html>
  `;
  
  try {
    await transporter.sendMail({
      from: CONFIG.emailConfig.auth.user,
      to: CONFIG.emailRecipients.join(', '),
      subject: `[Tests Factures] ${status} - ${results.summary.passed}/${results.summary.total} tests`,
      html: htmlContent
    });
    console.log(`📧 Email envoyé à: ${CONFIG.emailRecipients.join(', ')}`);
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
  }
}

/**
 * Vérifie si une alerte doit être déclenchée
 */
function shouldAlert(results) {
  if (results.summary.failed > CONFIG.maxFailures) return true;
  if (results.summary.coverage !== null && results.summary.coverage < CONFIG.coverageThreshold) return true;
  return !results.success;
}

/**
 * Affiche le résumé
 */
function printSummary(results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RÉSUMÉ DES TESTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`⏱️  Durée: ${results.duration}`);
  console.log(`📅 Date: ${results.timestamp}`);
  console.log(`\n📈 Résultats:`);
  console.log(`   ✅ Réussis: ${results.summary.passed}`);
  console.log(`   ❌ Échoués: ${results.summary.failed}`);
  console.log(`   ⏭️  Ignorés: ${results.summary.skipped}`);
  console.log(`   📊 Total: ${results.summary.total}`);
  if (results.summary.coverage !== null) {
    console.log(`\n📈 Couverture: ${results.summary.coverage}%`);
  }
  console.log(`\n${results.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Fonction principale
 */
async function executeTests() {
  try {
    const results = await runTests();
    printSummary(results);
    
    if (shouldAlert(results)) {
      await sendEmailNotification(results);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Mode d'exécution
const args = process.argv.slice(2);

if (args.includes('--once')) {
  executeTests()
    .then(results => process.exit(results.success ? 0 : 1))
    .catch(() => process.exit(1));
} else if (args.includes('--daemon')) {
  console.log(`🕐 Mode daemon - Schedule: ${CONFIG.testSchedule}`);
  executeTests();
  cron.schedule(CONFIG.testSchedule, () => executeTests());
  console.log('👀 En attente des prochaines exécutions...\n');
} else {
  console.log(`
📋 Script de Tests Automatisés

Usage:
  node runScheduledTests.js --once     # Exécution unique
  node runScheduledTests.js --daemon   # Mode daemon avec cron

Variables d'environnement:
  TEST_SCHEDULE       Cron expression (défaut: "0 */6 * * *")
  EMAIL_ENABLED       "true" pour activer les emails
  EMAIL_RECIPIENTS    Destinataires séparés par virgules
  SMTP_HOST/PORT/USER/PASS  Configuration SMTP
`);
}

module.exports = { executeTests, runTests };