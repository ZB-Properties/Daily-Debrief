
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

const fixAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users where isEmailVerified is false
    const usersToFix = await User.find({ isEmailVerified: false });
    console.log(`📊 Found ${usersToFix.length} users with isEmailVerified=false`);

    // Update them all to true
    const result = await User.updateMany(
      { isEmailVerified: false },
      { 
        $set: { 
          isEmailVerified: true,
          // Also ensure other fields exist
          twoFactorEnabled: { $ifNull: ["$twoFactorEnabled", false] }
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log('🎉 All users can now login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAllUsers();