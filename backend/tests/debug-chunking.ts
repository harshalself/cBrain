/**
 * Debug Chunking Issues
 */

import { SemanticChunkerService, ChunkingConfig } from "../src/features/vector/services/semantic-chunker.service";

async function debugChunking() {
  console.log("🔍 Debugging Chunking Process");
  console.log("============================\n");

  const chunker = new SemanticChunkerService();

  // Simple test content
  const testContent = `# Test Document

## Section 1
This is a test section with some content that should be long enough to form a chunk. This paragraph contains enough text to meet the minimum chunk size requirements.

## Section 2  
Another section with sufficient content to form a proper chunk. This section also has enough text to be considered a valid chunk by the chunking algorithm.

### Project Phoenix
Project Phoenix is a research initiative that focuses on quantum computing advancement. This project represents significant investment in future technology development.

## Technical Details
The technical specifications include advanced quantum processors with high-performance capabilities. These systems operate at extremely low temperatures for optimal performance.`;

  console.log("📄 Test Content Length:", testContent.length, "characters");
  console.log("📄 Test Content:");
  console.log(testContent);
  console.log("\n" + "=".repeat(50) + "\n");

  // Test with simpler config first
  const simpleConfig: ChunkingConfig = {
    strategy: "semantic",
    minChunkSize: 100, // Very low to debug
    maxChunkSize: 800,
    enableOverlap: false, // Disable overlap to debug
    preserveResearchProjects: false, // Disable special features
    enhanceSemanticBoundaries: false,
  };

  console.log("📋 Simple Test Configuration:");
  console.log(JSON.stringify(simpleConfig, null, 2));
  console.log();

  try {
    console.log("🔬 Running Simple Chunking...");
    const result = await chunker.chunkText(testContent, simpleConfig);

    console.log("✅ Simple Chunking Results:");
    console.log(`   Total Chunks: ${result.stats.totalChunks}`);
    console.log(`   Average Chunk Size: ${result.stats.averageChunkSize} characters`);
    console.log(`   Processing Time: ${result.stats.processingTimeMs}ms`);

    if (result.chunks.length > 0) {
      console.log("\n📦 Chunks:");
      result.chunks.forEach((chunk, index) => {
        console.log(`\nChunk ${index + 1} (${chunk.length} chars):`);
        console.log('"' + chunk.substring(0, 200) + (chunk.length > 200 ? '...' : '') + '"');
      });
    } else {
      console.log("\n❌ No chunks generated!");
    }

  } catch (error) {
    console.error("❌ Simple Chunking Failed:", error);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Now test with enhanced config
  const enhancedConfig: ChunkingConfig = {
    strategy: "semantic",
    minChunkSize: 300,
    maxChunkSize: 1000,
    enableOverlap: true,
    overlapPercentage: 30,
    preserveResearchProjects: true,
    enhanceSemanticBoundaries: true,
  };

  console.log("📋 Enhanced Test Configuration:");
  console.log(JSON.stringify(enhancedConfig, null, 2));
  console.log();

  try {
    console.log("🔬 Running Enhanced Chunking...");
    const result = await chunker.chunkText(testContent, enhancedConfig);

    console.log("✅ Enhanced Chunking Results:");
    console.log(`   Total Chunks: ${result.stats.totalChunks}`);
    console.log(`   Average Chunk Size: ${result.stats.averageChunkSize} characters`);
    console.log(`   Processing Time: ${result.stats.processingTimeMs}ms`);

    if (result.chunks.length > 0) {
      console.log("\n📦 Enhanced Chunks:");
      result.chunks.forEach((chunk, index) => {
        console.log(`\nChunk ${index + 1} (${chunk.length} chars):`);
        console.log('"' + chunk.substring(0, 200) + (chunk.length > 200 ? '...' : '') + '"');
      });
    } else {
      console.log("\n❌ No enhanced chunks generated!");
    }

  } catch (error) {
    console.error("❌ Enhanced Chunking Failed:", error);
  }
}

// Run the debug
debugChunking().catch(console.error);