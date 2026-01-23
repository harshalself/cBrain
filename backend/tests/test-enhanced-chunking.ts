/**
 * Test Enhanced Chunking Implementation
 *
 * This script tests the improved chunking logic before full deployment
 */

import { SemanticChunkerService, ChunkingConfig } from "../src/features/vector/services/semantic-chunker.service";

async function testEnhancedChunking() {
  console.log("🧪 Testing Enhanced Chunking Implementation");
  console.log("==========================================\n");

  const chunker = new SemanticChunkerService();

  // Test content with research projects and various sections
  const testContent = `# QuantumForge Technologies - Test Content

## Company Overview
QuantumForge Technologies is a pioneering quantum computing company founded in 2017 by Dr. Elena Vasquez and Marcus Chen in the underground research facility beneath Mount Ararat.

## Research Projects

### Project Phoenix
Project Phoenix focuses on developing quantum teleportation for data transmission. This groundbreaking research aims to achieve instantaneous data transfer using quantum entanglement principles.

### Project Atlas
Project Atlas is creating a quantum GPS system with millimeter accuracy. The project utilizes quantum sensors to provide unprecedented positioning precision for navigation systems.

### Project Genesis
Project Genesis explores artificial quantum consciousness research. This ambitious project investigates the fundamental nature of quantum computation and consciousness.

## Core Technologies

### Ararat Crystal Technology
Ararat Crystal is a synthetic material created through a proprietary process involving high-pressure diamond synthesis at 2.5 million PSI.

### Crystal Lattice Entanglement (CLE)
CLE is QuantumForge's breakthrough error correction technology that achieves 99.97% error correction rate at 22°C ambient temperature.

## Products and Services

### QuantumForge Cloud Platform
A subscription-based quantum computing service offering QuantumForge Basic ($499/month) with 100 qubit-hours.

### QuantumForge Nexus
The world's first quantum-classical hybrid supercomputer featuring 16 Harmony Q3 processors with 16,384 total qubits.`;

  // Test with enhanced configuration (matching source extractor)
  const enhancedConfig: ChunkingConfig = {
    strategy: "semantic",
    minChunkSize: 300, // Reduced for better granularity 
    maxChunkSize: 1000, // Optimal for BGE-M3 (vs previous 1200)
    enableOverlap: true,  // Enable chunk overlap for context preservation
    overlapPercentage: 30, // Increased for better context continuity
    preserveResearchProjects: true, // Preserve research project sections
    enhanceSemanticBoundaries: true, // Enhanced boundary detection
  };

  console.log("📋 Test Configuration:");
  console.log(JSON.stringify(enhancedConfig, null, 2));
  console.log("\n📄 Test Content Length:", testContent.length, "characters");
  console.log("📄 Test Content Preview:");
  console.log(testContent.substring(0, 200) + "...\n");

  try {
    console.log("🔬 Running Enhanced Chunking...");
    const result = await chunker.chunkText(testContent, enhancedConfig);

    console.log("✅ Chunking Results:");
    console.log(`   Total Chunks: ${result.stats.totalChunks}`);
    console.log(`   Average Chunk Size: ${result.stats.averageChunkSize} characters`);
    console.log(`   Processing Time: ${result.stats.processingTimeMs}ms`);

    console.log("\n📦 Chunk Details:");
    result.chunks.forEach((chunk, index) => {
      const metadata = result.metadata[index];
      console.log(`\nChunk ${index + 1}:`);
      console.log(`   Size: ${chunk.length} chars`);
      console.log(`   Contains Key Facts: ${metadata.containsKeyFacts}`);
      console.log(`   Fact Types: ${metadata.factTypes?.join(', ') || 'none'}`);
      console.log(`   Preview: ${chunk.substring(0, 150)}...`);

      // Check for research project preservation
      if (chunk.toLowerCase().includes('project phoenix') ||
          chunk.toLowerCase().includes('project atlas') ||
          chunk.toLowerCase().includes('project genesis')) {
        console.log(`   ✅ Research Project Detected: ${chunk.match(/Project \w+/)}`);
      }
    });

    // Analyze chunk boundaries
    console.log("\n🔍 Boundary Analysis:");
    let researchChunks = 0;
    let technologyChunks = 0;
    let productChunks = 0;

    result.chunks.forEach(chunk => {
      const lower = chunk.toLowerCase();
      if (lower.includes('project')) researchChunks++;
      if (lower.includes('crystal') || lower.includes('technology')) technologyChunks++;
      if (lower.includes('platform') || lower.includes('nexus')) productChunks++;
    });

    console.log(`   Research Project Chunks: ${researchChunks}`);
    console.log(`   Technology Chunks: ${technologyChunks}`);
    console.log(`   Product Chunks: ${productChunks}`);

    console.log("\n✅ Enhanced Chunking Test Completed Successfully!");

  } catch (error) {
    console.error("❌ Chunking Test Failed:", error);
  }
}

// Run the test
testEnhancedChunking().catch(console.error);