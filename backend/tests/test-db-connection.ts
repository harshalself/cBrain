// Simple database connection test
import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection...\n');

    console.log('Configuration:');
    console.log(`  Host: ${process.env.DB_HOST}`);
    console.log(`  Port: ${process.env.DB_PORT}`);
    console.log(`  User: ${process.env.DB_USER}`);
    console.log(`  Database: ${process.env.DB_DATABASE}`);
    console.log(`  Password: ${process.env.DB_PASSWORD?.substring(0, 4)}...${process.env.DB_PASSWORD?.slice(-4)}\n`);

    const db = knex({
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: parseInt(process.env.DB_PORT || '6543'),
            ssl: { rejectUnauthorized: false }
        }
    });

    try {
        console.log('Attempting connection...');
        await db.raw('SELECT NOW() as current_time');
        console.log('✅ Database connection successful!\n');

        // Check if users table exists
        const tableExists = await db.schema.hasTable('users');
        console.log(`Users table exists: ${tableExists ? '✅ Yes' : '❌ No'}\n`);

        if (tableExists) {
            const userCount = await db('users').count('* as count').first();
            console.log(`Users in database: ${userCount?.count || 0}`);
        }

        console.log('\n🎉 Connection test passed! Ready to run migrations.');
        await db.destroy();
        process.exit(0);

    } catch (error: any) {
        console.log('❌ Database connection failed!\n');
        console.error('Error:', error.message);
        console.error('Code:', error.code);

        if (error.message.includes('Tenant or user not found')) {
            console.log('\n💡 This error means:');
            console.log('   - The database credentials are incorrect');
            console.log('   - Check DB_HOST, DB_USER, and DB_PASSWORD in .env');
            console.log('   - Verify in Supabase dashboard: Settings → Database');
        } else if (error.message.includes('timeout')) {
            console.log('\n💡 Connection timeout - check your network or firewall');
        }

        await db.destroy();
        process.exit(1);
    }
}

testDatabaseConnection();
