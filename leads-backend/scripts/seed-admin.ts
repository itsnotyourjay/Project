// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin1234';

  try {
    // Check if admin already exists
    const existingAdmin = await usersService.findByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log(`Email: ${adminEmail}`);
      console.log('Updating admin status to true...');
      
      // Update the existing user to be admin
      await usersService['usersRepository'].update(
        { email: adminEmail },
        { isAdmin: true }
      );
      
      console.log('✅ Admin status updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user directly in database
      const adminUser = await usersService['usersRepository'].save({
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        registeredAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`User ID: ${adminUser.id}`);
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }

  await app.close();
}

seedAdmin();
