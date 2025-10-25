const bcrypt = require('bcryptjs');
async function verifyHash() {
  const password = 'mmmm';
  const storedHash = '$2b$10$DMIFZnExOt.aqojqkOdY/usOAkaJh/TbpGSSAbuNN2CpVhtMmCLU2';
  const isMatch = await bcrypt.compare(password, storedHash);
  console.log('Password match for mmmm:', isMatch);
}
verifyHash();