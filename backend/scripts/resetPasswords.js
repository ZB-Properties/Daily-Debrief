const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


// Define the correct passwords for each user (based on your seed file)
const userPasswords = {
  'alisonP@hotmail.com': 'AliPo33',
  'Smithy8@gmail.com': 'Smithy12',
  'sarah@example.com': 'SarahJ9#',
  'MIB5@hotmail.com': 'MikeB60',
  'EDavis@example.com': 'DavisE4',
  'david@example.com': 'Passme8',
  'lisaA7@gmail.com': 'LisaA77',
  'robert9@hotmail.com': 'RTay91'
};

const resetPasswords = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users\n`);

    let updated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const correctPassword = userPasswords[user.email];
        
        if (!correctPassword) {
          console.log(`⚠️ No password defined for ${user.email}, skipping...`);
          failed++;
          continue;
        }

        console.log(`🔄 Resetting password for: ${user.name} (${user.email})`);
        
        // Hash the correct password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(correctPassword, salt);
        
        // Update user's password
        user.password = hashedPassword;
        await user.save();
        
        console.log(`✅ Password reset to: ${correctPassword}`);
        updated++;
        
        // Verify the password works
        const testMatch = await bcrypt.compare(correctPassword, user.password);
        console.log(`   Verification: ${testMatch ? '✅ Password works' : '❌ Password mismatch'}\n`);
        
      } catch (err) {
        console.error(`❌ Error updating ${user.email}:`, err.message);
        failed++;
      }
    }

    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated} users`);
    console.log(`❌ Failed: ${failed} users`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📌 Disconnected from MongoDB');
  }
};

resetPasswords();