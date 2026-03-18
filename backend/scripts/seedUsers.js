const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const users = [
  {
    name: 'Alison Powell',
    email: 'alisonP@hotmail.com',
    password: 'AliPo33',
    status: 'offline', 
    bio: 'UX Designer | Creative Thinker',
    profileImage: 'https://ui-avatars.com/api/?name=Alison+Powell&background=random',
    isActive: true
  },
  {
    name: 'John Smith',
    email: 'Smithy8@gmail.com',
    password: 'Smithy12',
    status: 'away', 
    bio: 'Software Developer',
    profileImage: 'https://ui-avatars.com/api/?name=John+Smith&background=random',
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'SarahJ9#',
    status: 'online', 
    bio: 'Product Manager',
    profileImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
    isActive: true
  },
  {
    name: 'Michael Brown',
    email: 'MIB5@hotmail.com',
    password: 'MikeB60',
    status: 'online', 
    bio: 'Graphic Designer',
    profileImage: 'https://ui-avatars.com/api/?name=Michael+Brown&background=random',
    isActive: true
  },
  {
    name: 'Emily Davis',
    email: 'EDavis@example.com',
    password: 'DavisE4',
    status: 'online', 
    bio: 'Content Writer',
    profileImage: 'https://ui-avatars.com/api/?name=Emily+Davis&background=random',
    isActive: true
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: 'Passme8',
    status: 'busy', 
    bio: 'DevOps Engineer',
    profileImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=random',
    isActive: true
  },
  {
    name: 'Lisa Anderson',
    email: 'lisaA7@gmail.com',
    password: 'LisaA77',
    status: 'offline', 
    bio: 'Marketing Specialist',
    profileImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=random',
    isActive: true
  },
  {
    name: 'Robert Taylor',
    email: 'robert9@hotmail.com',
    password: 'RTay91',
    status: 'busy', 
    bio: 'Data Scientist',
    profileImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=random',
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    console.log('🔌 MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    // Create users with MANUAL password hashing
    console.log('\n👥 Creating users...');
    
    for (const userData of users) {
      console.log(`📝 Creating ${userData.name}...`);
      
      // Hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        status: userData.status,
        bio: userData.bio,
        profileImage: userData.profileImage,
        isActive: userData.isActive
      });
      
      await user.save();
      console.log(`✅ Created: ${userData.name} (${userData.email})`);
      
      // Verify the password works
      const isValid = await bcrypt.compare(userData.password, hashedPassword);
      console.log(`   Password verification: ${isValid ? '✅ OK' : '❌ Failed'}\n`);
    }

    console.log('\n🎉 All users created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📌 Disconnected from MongoDB');
  }
};

seedUsers();