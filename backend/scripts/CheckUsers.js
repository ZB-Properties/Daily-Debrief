// backend/scripts/checkUsers.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get counts
    const totalUsers = await User.countDocuments();
    const usersWithVerifiedFalse = await User.countDocuments({ isEmailVerified: false });
    const usersWithNoVerifiedField = await User.countDocuments({ 
      isEmailVerified: { $exists: false } 
    });
    const usersWithVerifiedTrue = await User.countDocuments({ isEmailVerified: true });

    console.log('\n📊 DATABASE STATISTICS:');
    console.log('=================================');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with isEmailVerified = false: ${usersWithVerifiedFalse}`);
    console.log(`Users with no isEmailVerified field: ${usersWithNoVerifiedField}`);
    console.log(`Users with isEmailVerified = true: ${usersWithVerifiedTrue}`);

    // Show sample of users with issues
    if (usersWithVerifiedFalse > 0) {
      const sampleUsers = await User.find({ isEmailVerified: false }).limit(3);
      console.log('\n📧 Sample users with isEmailVerified = false:');
      sampleUsers.forEach(user => {
        console.log(`  - ${user.email} (created: ${user.createdAt})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();