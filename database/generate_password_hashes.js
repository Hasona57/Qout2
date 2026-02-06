// Generate bcrypt hashes for passwords
const bcrypt = require('bcrypt');

async function generateHashes() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const posHash = await bcrypt.hash('pos123', 10);
  
  console.log('admin123 hash:', adminHash);
  console.log('pos123 hash:', posHash);
  
  return { adminHash, posHash };
}

generateHashes().catch(console.error);






