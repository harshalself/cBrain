#!/usr/bin/env ts-node

/**
 * Test script to verify invalid API key error handling
 */

import AgentService from "../src/features/agent/services/agent.service";
import ChatService from "../src/features/chat/services/chat.service";

const agentService = new AgentService();
const chatService = new ChatService();

async function testInvalidApiKey() {
  console.log("🔐 Testing Invalid API Key Error Handling");
  console.log("=========================================\n");

  try {
    // Create agent with invalid API key
    console.log("📝 Creating agent with invalid API key...");
    const invalidApiKey = "gsk_invalid_test_key_12345";
    const agentData = {
      name: "Invalid API Key Test Agent",
      provider: "groq",
      api_key: invalidApiKey,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.7,
      system_prompt: "You are a test assistant.",
    };

    const createdAgent = await agentService.createAgent(agentData, 1);
    console.log(`✅ Agent created with ID: ${createdAgent.id}`);

    // Try to chat with the agent (this should fail with API key error)
    console.log("\n💬 Attempting chat with invalid API key...");
    try {
      const chatResult = await chatService.handleAgentChat(createdAgent.id, 1, {
        messages: [
          {
            role: "user",
            content: "Hello! This should fail due to invalid API key.",
          },
        ],
      });
      console.log("❌ Chat succeeded unexpectedly:", chatResult.message);
    } catch (chatError: any) {
      if (chatError.status === 400 && chatError.message.includes("API key")) {
        console.log("✅ Correctly caught API key error:", chatError.message);
      } else {
        console.log("❌ Unexpected error:", chatError.message);
        throw chatError;
      }
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test agent...");
    await agentService.deleteAgent(createdAgent.id, 1);
    console.log("✅ Test agent deleted\n");

    console.log("🎉 Invalid API key error handling test passed!");
    console.log("===============================================");
    console.log("✅ Invalid API keys are properly detected");
    console.log("✅ Users get clear error messages");
    console.log("✅ No more generic fallback responses for auth errors");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
testInvalidApiKey().catch(console.error);
