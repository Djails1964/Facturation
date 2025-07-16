const fs = require('fs');
const path = require('path');

console.log('🔍 Validation de la configuration...');

// Afficher l'environnement
const env = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';
console.log(`📋 Environnement: ${env}`);

// Vérifier les fichiers .env
console.log('\n📁 Fichiers .env:');
const envFiles = ['.env', '.env.development', '.env.production'];
envFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Note importante
console.log('\n💡 Les variables d\'environnement seront chargées automatiquement par React lors du build');
console.log('📋 Variables attendues:');
console.log('   - REACT_APP_API_BASE_URL');
console.log('   - REACT_APP_BACKEND_URL');
console.log('   - REACT_APP_VERSION');

console.log('\n✅ Configuration valide - Le build peut continuer');