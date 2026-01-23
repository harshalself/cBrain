/**
 * Test Advanced Chunking Strategies
 * 
 * This script tests the new hierarchical and content-aware chunking strategies
 * to demonstrate improved chunking for different content types.
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment
dotenv.config();

// Import the chunking service
import { SemanticChunkerService, ChunkingConfig } from "../src/features/vector/services/semantic-chunker.service";

async function testAdvancedChunking() {
  console.log("🚀 === ADVANCED CHUNKING STRATEGIES TEST ===");
  console.log("Testing hierarchical and content-aware chunking\n");

  const chunker = new SemanticChunkerService();

  // Sample text with different content types
  const sampleText = `# QuantumForge Technologies - Advanced Overview

## Company Overview
QuantumForge Technologies is a pioneering quantum computing company founded in 2017 by Dr. Elena Vasquez and Marcus Chen. The company specializes in developing room-temperature quantum processors using proprietary Ararat Crystal technology.

## Technical Specifications
The Harmony Q3 processor features:
- 1024 physical qubits arranged in a 32x32 lattice
- 99.99% fidelity rate for quantum operations
- Room temperature operation using Ararat Crystal stabilization
- 2 petahertz processing speed
- Integrated cooling system using liquid helium circulation

## Research Projects
### Project Phoenix
Project Phoenix focuses on quantum teleportation for secure data transmission. The project aims to achieve 99.9% teleportation fidelity over distances up to 1000 kilometers using quantum entanglement protocols.

### Project Atlas  
Project Atlas is developing a quantum GPS system with millimeter-level accuracy. The system uses quantum sensors to detect gravitational anomalies and provide navigation data independent of satellite systems.

## Product Portfolio
QuantumForge Cloud Platform offers subscription-based quantum computing services:
- QuantumForge Basic: $499/month - 100 qubit-hours
- QuantumForge Pro: $2,499/month - 1000 qubit-hours  
- QuantumForge Enterprise: Custom pricing - dedicated processors
`;

  // Test configurations
  const configs: Array<{ name: string; config: ChunkingConfig }> = [
    {
      name: "Standard Semantic Chunking",
      config: {
        strategy: "semantic",
        maxChunkSize: 800,
        minChunkSize: 300
      }
    },
    {
      name: "Hierarchical Chunking (Summary + Detail)",
      config: {
        strategy: "hierarchical",
        maxChunkSize: 800,
        minChunkSize: 300,
        hierarchicalSummarySize: 200
      }
    },
    {
      name: "Content-Aware Chunking",
      config: {
        strategy: "content-aware",
        maxChunkSize: 800,
        minChunkSize: 300,
        technicalKeywords: ['specifications', 'qubits', 'fidelity', 'processor']
      }
    },
    {
      name: "Hybrid: Content-Aware + Hierarchical",
      config: {
        strategy: "content-aware",
        enableHierarchical: true,
        maxChunkSize: 800,
        minChunkSize: 300,
        hierarchicalSummarySize: 150,
        technicalKeywords: ['specifications', 'qubits', 'fidelity', 'processor']
      }
    }
  ];

  // Test each configuration
  for (const { name, config } of configs) {
    console.log(`\n🔬 Testing: ${name}`);
    console.log("=".repeat(60));

    try {
      const result = await chunker.chunkText(sampleText, config);
      
      console.log(`📊 Results:`);
      console.log(`   Total chunks: ${result.stats.totalChunks}`);
      console.log(`   Average size: ${result.stats.averageChunkSize} chars`);
      console.log(`   Processing time: ${result.stats.processingTimeMs}ms\n`);

      // Show first few chunks as examples
      console.log(`📄 Chunk Examples:`);
      result.chunks.slice(0, 3).forEach((chunk, index) => {
        const metadata = result.metadata[index];
        console.log(`\n   Chunk ${index + 1} (${chunk.length} chars):`);
        console.log(`   Strategy: ${metadata.strategy}`);
        console.log(`   Contains key facts: ${metadata.containsKeyFacts}`);
        console.log(`   Fact types: ${metadata.factTypes?.join(', ') || 'none'}`);
        console.log(`   Content: "${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}"`);
      });

      if (result.chunks.length > 3) {
        console.log(`\n   ... ${result.chunks.length - 3} more chunks`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Comparison analysis
  console.log(`\n📈 === CHUNKING STRATEGY COMPARISON ===`);
  console.log(`
🎯 Key Improvements:

1. **Hierarchical Chunking**:
   - Creates summary chunks for quick overview
   - Maintains detailed chunks for comprehensive context
   - Better for Q&A systems (can use summary for quick answers)

2. **Content-Aware Chunking**:
   - Adjusts chunk size based on content type
   - Smaller chunks for technical specifications (easier to find specific details)
   - Larger chunks for narrative content (preserves context)

3. **Hybrid Approach**:
   - Combines both strategies for optimal results
   - Adapts to content AND creates hierarchical structure
   - Best for complex documents with mixed content types

🚀 **Usage Recommendations**:
   - Use hierarchical for FAQ/Q&A systems
   - Use content-aware for technical documentation
   - Use hybrid for complex knowledge bases
   - Use standard semantic for general documents
`);

  console.log(`\n✅ Advanced chunking test complete!`);
}

// Run the test
testAdvancedChunking().catch(console.error);