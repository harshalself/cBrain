import knex from '../database/index.schema';
import bcrypt from 'bcrypt';

/**
 * Script to create an admin user
 * Run with: npm run create-admin
 */

async function createAdmin() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || '12345678';
        const adminName = process.env.ADMIN_NAME || 'Admin User';

        console.log('🔧 Creating admin user...');

        // Check if admin already exists
        const existingAdmin = await knex('users')
            .where({ email: adminEmail })
            .first();

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists with email:', adminEmail);
            console.log('   User ID:', existingAdmin.id);
            console.log('   Role:', existingAdmin.role);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user - first we need to insert then update created_by to reference itself
        const [admin] = await knex('users')
            .insert({
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                role: 'admin',
                onboarding_completed: true,
                created_by: 1, // Temporary value, will update to self-reference
                created_at: new Date(),
                updated_at: new Date(),
            })
            .returning('*');

        // Update created_by to reference itself (self-created)
        await knex('users')
            .where({ id: admin.id })
            .update({ created_by: admin.id });

        console.log('✅ Admin user created successfully!');
        console.log('   Email:', admin.email);
        console.log('   Name:', admin.name);
        console.log('   Role:', admin.role);
        console.log('   ID:', admin.id);
        console.log('\n📌 Login credentials:');
        console.log('   Email:', adminEmail);
        console.log('   Password:', adminPassword);
        console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();

