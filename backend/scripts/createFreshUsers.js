const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const freshUsers = [
  {
    name: 'Emma Thompson',
    email: 'emma.thompson@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'Creative Director'
  },
  {
    name: 'James Anderson',
    email: 'james.anderson@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'Lead Developer'
  },
  {
    name: 'Sophia Martinez',
    email: 'sophia.martinez@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'UX Researcher'
  },
  {
    name: 'William Clark',
    email: 'william.clark@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'Product Owner'
  },
  {
    name: 'Olivia White',
    email: 'olivia.white@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'Frontend Developer'
  },
  {
    name: 'Benjamin Lee',
    email: 'benjamin.lee@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'Backend Engineer'
  },
  {
    name: 'Charlotte King',
    email: 'charlotte.king@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'QA Specialist'
  },
  {
    name: 'Daniel Wright',
    email: 'daniel.wright@test.com',
    password: 'Password123',
    status: 'online',
    bio: 'DevOps Lead'
  }
];

const createFreshUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    //const deleted = await User.deleteMany({});
    //console.log('Deleted ' + deleted.deletedCount + ' existing users');

    console.log('\nCreating 8 new users...');
    
    for (const userData of freshUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        status: userData.status,
        bio: userData.bio,
        profileImage: 'https://ui-avatars.com/api/?name=' + userData.name.replace(' ', '+') + '&background=random',
        isActive: true
      });
      
      await user.save();
      console.log('Created: ' + userData.name + ' - ' + userData.email + ' / ' + userData.password);
    }

    console.log('\nAll 8 users created successfully!');
    console.log('\nLogin Credentials:');
    console.log('============================================================');
    freshUsers.forEach(u => {
      console.log(u.name + ' | ' + u.email + ' | ' + u.password);
    });
    console.log('============================================================');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createFreshUsers();