import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../modules/admin/admin.service';

async function grantAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npm run grant-admin <email>');
    console.error('Example: npm run grant-admin alice@example.com');
    process.exit(1);
  }

  const [email] = args;

  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    const user = await adminService.grantAdminByEmail(email);

    console.log('\n=== Admin Role Granted ===');
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName}`);
    console.log(`Is Admin: ${user.isAdmin}`);
    console.log('==========================\n');
  } catch (error) {
    console.error('Error granting admin role:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
grantAdmin();
