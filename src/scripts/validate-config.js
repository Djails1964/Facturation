const fs = require('fs');
const path = require('path');

/**
 * CONFIGURATION DU SCHÉMA
 * Ajoutez vos nouvelles variables ici sans modifier la logique du script
 */
const CONFIG_SCHEMA = {
  REACT_APP_ENV: { required: true, pattern: /^(development|staging|pre-production|production)$/ },
  REACT_APP_API_BASE_URL: { required: true, isUrlOrPath: true },
  REACT_APP_BACKEND_URL: { required: false, isUrlOrPath: true },
  REACT_APP_VERSION: { required: false },
};

console.log('🚀 Démarrage de la validation dynamique...');

const currentEnv = process.env.REACT_APP_ENV || 'development';
let errors = [];
let warnings = [];

// --- 1. DETECTION DYNAMIQUE DES FICHIERS ---
console.log('\n📂 Analyse du répertoire...');
const rootDir = process.cwd();
const detectedEnvFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('.env'));

detectedEnvFiles.forEach(file => {
  const isCurrent = file === `.env.${currentEnv}` || (currentEnv === 'development' && file === '.env');
  console.log(`   ${isCurrent ? '⭐' : '📄'} ${file} détecté`);
});

// --- 2. VALIDATION DES VARIABLES ---
console.log(`\n🔍 Vérification des variables pour l'environnement : [${currentEnv}]`);

Object.entries(CONFIG_SCHEMA).forEach(([key, rules]) => {
  const value = process.env[key];

  // Vérification de présence
  if (rules.required && !value) {
    errors.push(`Manquant : La variable ${key} est obligatoire.`);
    return;
  }

  if (value) {
    // Vérification de format (Regex)
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`Format invalide : ${key} ("${value}") ne respecte pas le pattern.`);
    }

    // Vérification d'URL stricte
    if (rules.isUrl) {
      try {
        new URL(value);
      } catch (e) {
        errors.push(`URL invalide : ${key} ("${value}") n'est pas une URL valide.`);
      }
    }

    // Vérification d'URL ou de chemin relatif (nouvelle règle)
    if (rules.isUrlOrPath) {
      const isRelativePath = value.startsWith('/');
      const isValidUrl = (() => {
        try {
          new URL(value);
          return true;
        } catch (e) {
          return false;
        }
      })();
      
      if (!isRelativePath && !isValidUrl) {
        errors.push(`URL/Chemin invalide : ${key} ("${value}") doit être une URL valide ou un chemin relatif (commençant par /).`);
      }
    }
  }
});

// --- 3. BILAN ---
console.log('\n📊 Bilan de validation :');

if (errors.length > 0) {
  console.error(`❌ ÉCHEC : ${errors.length} erreur(s) critique(s) détectée(s) :`);
  errors.forEach(err => console.error(`   - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Succès : Toutes les variables sont conformes au schéma.');
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`   ⚠️ ${w}`));
  }
  console.log('🚀 Le build peut continuer...\n');
}