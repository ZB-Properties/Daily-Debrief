const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config({ path: '../.env' });

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let fixed = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Fix missing name
      if (!user.name) {
        user.name = 'User';
        needsUpdate = true;
      }
      
      // Fix missing bio
      if (!user.bio) {
        user.bio = "Hey there! I'm using Daily-Debrief";
        needsUpdate = true;
      }
      
      // Fix missing status
      if (!user.status) {
        user.status = 'offline';
        needsUpdate = true;
      }
      
      // Fix missing isActive
      if (user.isActive === undefined) {
        user.isActive = true;
        needsUpdate = true;
      }
      
      // Fix missing lastSeen
      if (!user.lastSeen) {
        user.lastSeen = new Date();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        fixed++;
        console.log(`✅ Fixed user: ${user.email || user._id}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixed} users`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📌 Disconnected');
  }
};

fixUsers();