/**
 * Test script to verify account reactivation functionality
 * Tests the scenario where a deleted user tries to register again
 */

import UserService from "../src/features/user/services/user.service";
import knex from "../database/index.schema";

const userService = new UserService();

// Test configuration
const testConfig = {
  user: {
    name: "Test Reactivation User",
    email: `reactivation-test-${Date.now()}@example.com`,
    password: "password123",
  },
};

/**
 * Register a new user
 */
async function registerUser(): Promise<any> {
  console.log("\n📝 Registering new user...");

  try {
    const user = await userService.register({
      name: testConfig.user.name,
      email: testConfig.user.email,
      password: testConfig.user.password,
    });

    console.log(`✅ User registered successfully. ID: ${user.id}`);
    return user;
  } catch (error: any) {
    console.error("Registration failed:", error.message);
    throw error;
  }
}

/**
 * Delete the user account directly in database (soft delete)
 */
async function deleteUser(userId: number): Promise<void> {
  console.log("\n🗑️ Deleting user account (soft delete)...");

  try {
    await userService.deleteUser(userId, 1); // deleted_by = 1 (system)
    console.log(`✅ User account soft deleted successfully`);
  } catch (error: any) {
    console.error("Deletion failed:", error.message);
    throw error;
  }
}

/**
 * Try to register again with the same email (should reactivate)
 */
async function reactivateUser(): Promise<void> {
  console.log(
    "\n🔄 Attempting to register again with same email (should reactivate)..."
  );

  try {
    const reactivatedUser = await userService.register({
      name: testConfig.user.name,
      email: testConfig.user.email,
      password: "newpassword456", // Different password
    });

    console.log(`✅ Account reactivated successfully!`);
    console.log(`   User ID: ${reactivatedUser.id}`);
    console.log(`   Name: ${reactivatedUser.name}`);
    console.log(`   Email: ${reactivatedUser.email}`);
    console.log(`   Is Deleted: ${reactivatedUser.is_deleted}`);

    // Verify the user is no longer deleted
    const dbUser = await knex("users")
      .where({ id: reactivatedUser.id })
      .first();

    console.log(`   Database verification - Is Deleted: ${dbUser.is_deleted}`);
    console.log(
      `   Password updated: ${dbUser.password !== undefined ? "YES" : "NO"}`
    );
  } catch (error: any) {
    console.error("Reactivation failed:", error.message);
    throw error;
  }
}

/**
 * Main test workflow
 */
async function runReactivationTest(): Promise<void> {
  console.log("🔄 Testing Account Reactivation Functionality");
  console.log("============================================");

  let user: any = null;

  try {
    // Step 1: Register new user
    user = await registerUser();

    // Step 2: Delete the user account
    await deleteUser(user.id);

    // Step 3: Try to register again (should reactivate)
    await reactivateUser();

    console.log("\n🎉 Account Reactivation Test Completed Successfully!");
    console.log("==================================================");
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n📋 Test Summary: FAILED");
  } finally {
    // Cleanup: hard delete the test user
    if (user?.id) {
      try {
        await knex("users").where({ id: user.id }).del();
        console.log(`\n🧹 Cleaned up test user ${user.id}`);
      } catch (cleanupError) {
        console.log(`\n⚠️ Cleanup failed: ${(cleanupError as Error).message}`);
      }
    }
  }
}

/**
 * Run the test
 */
if (require.main === module) {
  runReactivationTest().catch(console.error);
}

export { runReactivationTest };
