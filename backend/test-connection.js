const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a user
    const User = require('./models/User');
    const testUser = new User({
      name: 'Test Resident',
      email: 'test@example.com',
      password: 'password123',
      role: 'resident',
      phone: '1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      }
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    
    // Clean up
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user cleaned up!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  }
}

testConnection();