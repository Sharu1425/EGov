import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@egov.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        contactNo: '1234567890',
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

export default createAdmin; 