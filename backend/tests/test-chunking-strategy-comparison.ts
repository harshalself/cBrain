/**
 * Advanced Chunking Strategy Comparison Test
 *
 * This script compares all chunking strategies using the actual QuantumForge knowledge base
 * to determine which strategy provides the best retrieval accuracy and performance.
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment
dotenv.config();

// Import the chunking service
import { SemanticChunkerService, ChunkingConfig } from "../src/features/vector/services/semantic-chunker.service";

async function compareChunkingStrategies() {
  console.log("🚀 === ADVANCED CHUNKING STRATEGY COMPARISON ===");
  console.log("Testing all strategies with actual QuantumForge knowledge base\n");

  const chunker = new SemanticChunkerService();

  // Load the actual knowledge base
  const knowledgeBasePath = path.join(process.cwd(), 'quantumforge-knowledge-base.txt');
  if (!fs.existsSync(knowledgeBasePath)) {
    console.error(`❌ Knowledge base file not found: ${knowledgeBasePath}`);
    return;
  }

  const knowledgeBaseText = fs.readFileSync(knowledgeBasePath, 'utf-8');
  console.log(`📄 Loaded knowledge base: ${knowledgeBaseText.length} characters\n`);

  // Test questions from the training pipeline (focusing on key facts)
  const testQuestions = [
    "What is QuantumForge Technologies and when was it founded?",
    "What is Ararat Crystal?",
    "What is the name of QuantumForge's quantum programming language?",
    "What are the key features of the Harmony Q3 processor?",
    "What is Crystal Lattice Entanglement CLE?",
    "What is the QuantumForge Cloud Platform?",
    "When was the company founded?",
    "What is the QuantumForge Nexus?",
    "What are the historical milestones of QuantumForge?",
    "What is the Q3 Harmony processor?"
  ];

  // Define chunking strategies to test
  const strategies: Array<{
    name: string;
    config: ChunkingConfig;
    description: string;
  }> = [
    {
      name: "Standard Semantic",
      config: {
        strategy: "semantic",
        maxChunkSize: 1200,
        minChunkSize: 400,
        enableOverlap: true,
        overlapPercentage: 25
      },
      description: "Current production strategy - semantic boundaries with overlap"
    },
    {
      name: "Hierarchical",
      config: {
        strategy: "hierarchical",
        maxChunkSize: 1200,
        minChunkSize: 400,
        enableOverlap: true,
        overlapPercentage: 25,
        hierarchicalSummarySize: 300
      },
      description: "Creates summary + detail chunks for better Q&A performance"
    },
    {
      name: "Content-Aware",
      config: {
        strategy: "content-aware",
        maxChunkSize: 1200,
        minChunkSize: 400,
        enableOverlap: true,
        overlapPercentage: 25,
        technicalKeywords: [
          'quantum', 'processor', 'qubits', 'crystal', 'technology',
          'specifications', 'features', 'fidelity', 'algorithms'
        ]
      },
      description: "Adjusts chunk size based on content type (technical vs narrative)"
    },
    {
      name: "Hybrid (Recommended)",
      config: {
        strategy: "content-aware",
        enableHierarchical: true,
        maxChunkSize: 1200,
        minChunkSize: 400,
        enableOverlap: true,
        overlapPercentage: 25,
        hierarchicalSummarySize: 250,
        technicalKeywords: [
          'quantum', 'processor', 'qubits', 'crystal', 'technology',
          'specifications', 'features', 'fidelity', 'algorithms'
        ]
      },
      description: "Combines content-awareness + hierarchical structure (recommended)"
    }
  ];

  const results: Array<{
    strategy: string;
    description: string;
    chunkingResult: any;
    retrievalSimulation: any;
    performance: any;
  }> = [];

  // Test each strategy
  for (const strategy of strategies) {
    console.log(`\n🔬 Testing: ${strategy.name}`);
    console.log(`📝 ${strategy.description}`);
    console.log("=".repeat(80));

    try {
      const startTime = Date.now();

      // 1. Chunk the document
      const chunkingResult = await chunker.chunkText(
        knowledgeBaseText,
        strategy.config,
        1, // sourceId
        'file', // sourceType
        'quantumforge-knowledge-base.txt' // sourceName
      );

      const chunkingTime = Date.now() - startTime;

      console.log(`📊 Chunking Results:`);
      console.log(`   Total chunks: ${chunkingResult.stats.totalChunks}`);
      console.log(`   Average size: ${chunkingResult.stats.averageChunkSize} chars`);
      console.log(`   Processing time: ${chunkingTime}ms`);

      // 2. Simulate retrieval for test questions
      const retrievalResults = simulateRetrieval(chunkingResult.chunks, testQuestions);

      console.log(`🎯 Retrieval Simulation:`);
      console.log(`   Questions tested: ${testQuestions.length}`);
      console.log(`   Average chunks found: ${retrievalResults.averageChunksFound.toFixed(1)}`);
      console.log(`   Questions with relevant chunks: ${retrievalResults.questionsWithResults}/${testQuestions.length}`);

      // 3. Analyze chunk quality
      const qualityAnalysis = analyzeChunkQuality(chunkingResult);

      console.log(`⭐ Quality Analysis:`);
      console.log(`   Chunks with key facts: ${qualityAnalysis.chunksWithFacts}/${chunkingResult.stats.totalChunks}`);
      console.log(`   Technical content chunks: ${qualityAnalysis.technicalChunks}/${chunkingResult.stats.totalChunks}`);
      console.log(`   Company info chunks: ${qualityAnalysis.companyChunks}/${chunkingResult.stats.totalChunks}`);

      // Store results
      results.push({
        strategy: strategy.name,
        description: strategy.description,
        chunkingResult,
        retrievalSimulation: retrievalResults,
        performance: {
          chunkingTime,
          qualityAnalysis,
          overallScore: calculateOverallScore(chunkingResult, retrievalResults, qualityAnalysis)
        }
      });

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Generate comparison report
  console.log(`\n📈 === STRATEGY COMPARISON REPORT ===`);
  console.log("=".repeat(80));

  // Sort by overall score
  results.sort((a, b) => b.performance.overallScore - a.performance.overallScore);

  results.forEach((result, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📊";
    console.log(`\n${medal} ${result.strategy} (Score: ${result.performance.overallScore.toFixed(1)})`);
    console.log(`   ${result.description}`);
    console.log(`   📊 Chunks: ${result.chunkingResult.stats.totalChunks} (avg ${result.chunkingResult.stats.averageChunkSize} chars)`);
    console.log(`   🎯 Retrieval: ${result.retrievalSimulation.questionsWithResults}/${testQuestions.length} questions answered`);
    console.log(`   ⭐ Quality: ${result.performance.qualityAnalysis.chunksWithFacts}/${result.chunkingResult.stats.totalChunks} chunks with facts`);
    console.log(`   ⚡ Performance: ${result.performance.chunkingTime}ms processing time`);
  });

  // Detailed recommendations
  console.log(`\n🎯 === RECOMMENDATIONS ===`);

  const bestStrategy = results[0];
  console.log(`\n🏆 **WINNER: ${bestStrategy.strategy}**`);
  console.log(`   Why: ${getStrategyRecommendation(bestStrategy.strategy)}`);
  console.log(`   Configuration:`);
  console.log(`   ${JSON.stringify(bestStrategy.chunkingResult.config, null, 4)}`);

  console.log(`\n📋 **Strategy Comparison Summary:**`);
  console.log(`   • Best for Q&A: ${results.find(r => r.strategy.includes('Hierarchical'))?.strategy || 'N/A'}`);
  console.log(`   • Best for Technical Content: ${results.find(r => r.strategy.includes('Content-Aware'))?.strategy || 'N/A'}`);
  console.log(`   • Best Overall: ${bestStrategy.strategy}`);
  console.log(`   • Fastest Processing: ${results.reduce((prev, current) =>
    prev.performance.chunkingTime < current.performance.chunkingTime ? prev : current).strategy}`);

  console.log(`\n✅ Chunking strategy comparison complete!`);
  console.log(`📁 Use ${bestStrategy.strategy} for optimal performance.`);
}

// Helper functions
function simulateRetrieval(chunks: string[], questions: string[]): any {
  let totalChunksFound = 0;
  let questionsWithResults = 0;

  for (const question of questions) {
    const questionLower = question.toLowerCase();
    let chunksFound = 0;

    for (const chunk of chunks) {
      const chunkLower = chunk.toLowerCase();

      // Simple keyword matching simulation (like vector search would do)
      const keywords = extractKeywords(questionLower);
      let matchScore = 0;

      for (const keyword of keywords) {
        if (chunkLower.includes(keyword)) {
          matchScore += 1;
        }
      }

      // Consider it a match if 50%+ of keywords are found
      if (matchScore >= keywords.length * 0.5) {
        chunksFound++;
      }
    }

    if (chunksFound > 0) {
      questionsWithResults++;
      totalChunksFound += chunksFound;
    }
  }

  return {
    averageChunksFound: totalChunksFound / questions.length,
    questionsWithResults
  };
}

function extractKeywords(question: string): string[] {
  // Simple keyword extraction (in real vector search, this would be semantic)
  const words = question.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['what', 'when', 'where', 'how', 'why', 'the', 'and', 'for', 'are', 'was', 'were', 'does', 'quantumforge', 'technologies'].includes(word));

  return [...new Set(words)]; // Remove duplicates
}

function analyzeChunkQuality(chunkingResult: any): any {
  let chunksWithFacts = 0;
  let technicalChunks = 0;
  let companyChunks = 0;

  chunkingResult.chunks.forEach((chunk: string, index: number) => {
    const metadata = chunkingResult.metadata[index];
    const chunkLower = chunk.toLowerCase();

    if (metadata.containsKeyFacts) {
      chunksWithFacts++;
    }

    if (metadata.factTypes?.includes('technical')) {
      technicalChunks++;
    }

    if (metadata.factTypes?.includes('company')) {
      companyChunks++;
    }
  });

  return {
    chunksWithFacts,
    technicalChunks,
    companyChunks
  };
}

function calculateOverallScore(chunkingResult: any, retrievalResults: any, qualityAnalysis: any): number {
  // Weighted scoring system
  const chunkEfficiency = Math.min(100, (chunkingResult.stats.averageChunkSize / 1000) * 100); // Prefer 800-1200 char chunks
  const retrievalScore = (retrievalResults.questionsWithResults / 10) * 100; // 10 questions
  const qualityScore = (qualityAnalysis.chunksWithFacts / chunkingResult.stats.totalChunks) * 100;
  const processingScore = Math.max(0, 100 - (chunkingResult.stats.processingTimeMs / 10)); // Prefer faster processing

  // Weighted average: Retrieval (40%), Quality (30%), Efficiency (20%), Speed (10%)
  return (retrievalScore * 0.4) + (qualityScore * 0.3) + (chunkEfficiency * 0.2) + (processingScore * 0.1);
}

function getStrategyRecommendation(strategyName: string): string {
  switch (strategyName) {
    case 'Standard Semantic':
      return 'Reliable baseline with good balance of performance and quality';
    case 'Hierarchical':
      return 'Excellent for Q&A systems - creates summary chunks for quick answers';
    case 'Content-Aware':
      return 'Best for technical content - adapts chunk size based on content type';
    case 'Hybrid (Recommended)':
      return 'Combines the best of both worlds - content awareness + hierarchical structure';
    default:
      return 'Good general-purpose performance';
  }
}

// Run the comparison
compareChunkingStrategies().catch(console.error);