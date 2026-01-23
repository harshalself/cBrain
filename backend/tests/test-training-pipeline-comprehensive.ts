/**
 * Comprehensive Training Pipeline Analysis
 *
 * This script analyzes the current training pipeline state without performing uploads or training.
 * It uses the quantumforge-knowledge-base.txt file for reference and analyzes existing data.
 *
 * Usage:
 * Run: npm run ts-node scripts/test-training-pipeline-comprehensive.ts
 *
 * The script will:
 * - Login automatically
 * - Analyze current agent state and configuration
 * - Examine existing sources
 * - Test vector search quality on existing data
 * - Analyze chunking effectiveness
 * - Provide optimization recommendations
 *
 * Note: This analyzes existing data. For actual training, use your frontend to upload and train.
 */

import axios from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_AGENT_ID = 7;

// Hardcoded credentials for testing
const TEST_EMAIL = "harshal@gmail.com";
const TEST_PASSWORD = "harshal2004";

let authToken = "";

// Enhanced axios instance for detailed logging
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for training operations
  validateStatus: () => true,
});

// Enhanced logging with detailed step analysis
function logStep(step: string, details: string) {
  console.log(`\n🔬 ${step}`);
  console.log(`📋 ${details}`);
}

function logSubStep(substep: string, data?: any) {
  console.log(`   ✓ ${substep}`);
  if (data !== undefined) {
    if (typeof data === 'object') {
      console.log(`     ${JSON.stringify(data, null, 6)}`);
    } else {
      console.log(`     ${data}`);
    }
  }
}

function logError(error: string, details?: any) {
  console.log(`   ❌ ${error}`);
  if (details) {
    console.log(`     ${JSON.stringify(details, null, 6)}`);
  }
}

function logWarning(warning: string, details?: any) {
  console.log(`   ⚠️  ${warning}`);
  if (details) {
    console.log(`     ${JSON.stringify(details, null, 6)}`);
  }
}

async function analyzeTrainingPipeline() {
  console.log("🚀 === COMPREHENSIVE TRAINING PIPELINE ANALYSIS ===");
  console.log("📊 Analyzing: Current Agent State → Vector Quality → Chunking Effectiveness");
  console.log("🎯 Agent: 7 | Focus: Performance & Accuracy Assessment\n");
  
  let trainingMetrics: any = {
    chunking: {},
    vectorization: {},
    retrieval: {}
  };
  
  try {
    // STEP 1: Authentication
    logStep("AUTHENTICATION", "Logging in to obtain access token");
    
    const authStartTime = Date.now();
    const loginResponse = await api.post("/users/login", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    const authTime = Date.now() - authStartTime;
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.data?.message}`);
    }
    
    authToken = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    logSubStep("Authentication successful", `${authTime}ms`);
    logSubStep("User ID", loginResponse.data.data.id);
    trainingMetrics.auth = { time: authTime, status: "success" };
    
    // STEP 2: Agent Analysis
    logStep("AGENT ANALYSIS", "Analyzing current agent state and configuration");
    
    const agentResponse = await api.get(`/agents/${TEST_AGENT_ID}`);
    if (agentResponse.status !== 200) {
      throw new Error(`Failed to get agent: ${agentResponse.data?.message}`);
    }
    
    const agent = agentResponse.data.data;
    logSubStep("Agent Configuration:");
    logSubStep("  - Name", agent.name);
    logSubStep("  - Provider/Model", `${agent.provider}/${agent.model}`);
    logSubStep("  - Temperature", agent.temperature);
    logSubStep("  - Training Status", agent.training_status);
    logSubStep("  - Embedded Sources", agent.embedded_sources_count);
    logSubStep("  - Total Sources", agent.total_sources_count);
    
    trainingMetrics.agent = {
      name: agent.name,
      provider: agent.provider,
      model: agent.model,
      initialEmbeddedSources: agent.embedded_sources_count,
      initialTotalSources: agent.total_sources_count,
      trainingStatus: agent.training_status
    };
    
    // STEP 3: Current Sources Analysis
    logStep("CURRENT SOURCES ANALYSIS", "Examining existing sources and their status");
    
    const sourcesResponse = await api.get(`/sources/agent/${TEST_AGENT_ID}`);
    const existingSources = sourcesResponse.data.data || [];
    
    logSubStep("Existing Sources", existingSources.length);
    existingSources.forEach((source: any, index: number) => {
      logSubStep(`  Source ${index + 1}:`, {
        id: source.id,
        name: source.name,
        type: source.source_type,
        status: source.status,
        embedded: source.is_embedded
      });
    });
    
    trainingMetrics.existingSources = {
      count: existingSources.length,
      embedded: existingSources.filter((s: any) => s.is_embedded).length,
      completed: existingSources.filter((s: any) => s.status === 'completed').length
    };
    
    // STEP 4: Vector Database Analysis
    logStep("VECTOR DATABASE ANALYSIS", "Comprehensive chunking and retrieval effectiveness testing");
    
    // Comprehensive test queries covering entire QuantumForge knowledge base
    const testQueries = [
      // Company Overview & Founding (Beginning of document)
      "QuantumForge Technologies founded by Elena Vasquez and Marcus Chen",
      "Ararat Crystal synthetic diamond matrix with rare earth elements",
      "underground research facility beneath Mount Ararat",
      
      // Historical Milestones (Early sections)
      "2017 company founded after discovering Ararat Crystal",
      "2018 first successful quantum bit stabilization at room temperature",
      "2023 revolutionary Q3 Harmony processor with 1024 qubits",
      "2024 introduction of QuantumForge proprietary programming language QScript",
      
      // Core Technologies (Middle sections)
      "Crystal Lattice Entanglement CLE error correction technology",
      "high-pressure diamond synthesis at 2.5 million PSI",
      "neodymium europium terbium isotopes for crystal infusion",
      "zero-point energy stabilization spontaneous qubit formation",
      "99.97% error correction rate at 22°C ambient temperature",
      
      // Products & Services
      "QuantumForge Cloud Platform subscription-based quantum computing",
      "QuantumForge Basic 499 dollars per month 100 qubit-hours",
      "QuantumForge Nexus quantum-classical hybrid supercomputer",
      "16 Harmony Q3 processors 16384 total qubits",
      
      // Research & Development
      "Project Phoenix quantum teleportation for data transmission",
      "Project Atlas quantum GPS system with millimeter accuracy",
      "Project Genesis artificial quantum consciousness research",
      "Project Titan room-temperature quantum fusion reactor design",
      
      // Manufacturing Process
      "Crystal Growth Facility 50000 square meters underground complex",
      "annual production 500 kg of Ararat Crystal",
      "automated manufacturing process laser precision cutting",
      "24-hour burn-in process for processor testing",
      
      // Company Culture & Operations
      "Crystal Code philosophy clarity precision stability innovation",
      "Crystal Equity Program stock options for all employees",
      "Quantum Learning Fund 10000 dollars annual professional development",
      "quantum key distribution for all communications",
      
      // Market Position & Competition
      "35% global quantum computing market share",
      "proprietary materials Ararat Crystal 10x performance advantage",
      "IonTech SuperQ QuantumSoft EntangleCorp competitors",
      
      // Future Roadmap (Later sections)
      "2025-2027 strategic goals quantum internet drug discovery",
      "2030 long-term vision quantum consciousness space computing",
      "QuantumForge Q4 Infinity processor 4096 physical qubits",
      "quantum internet infrastructure 10000km transcontinental fiber",
      
      // Advanced Research Labs
      "Quantum Materials Lab 50-foot diameter pressure vessel",
      "Quantum Algorithms Research Center optimization simulation cryptography",
      "quantum key distribution BB84 protocol implementation",
      
      // Strategic Partnerships
      "MIT joint quantum algorithm research center 50 million endowment",
      "PharmaCorp 200 million drug discovery acceleration program",
      "US Department of Defense 500 million quantum communication networks",
      
      // Employee Development
      "QuantumForge Academy 12-week intensive quantum physics course",
      "Patent Bonus Program 50000 dollars per approved patent",
      "Innovation Grants up to 100000 dollars for research projects",
      
      // Environmental Initiatives
      "Green Quantum Initiative 100% renewable energy mandate",
      "carbon neutral operations carbon offset program",
      "95% water reuse in manufacturing processes",
      
      // Risk Management
      "Enterprise Cybersecurity Framework quantum key distribution",
      "quantum random number generation for cryptographic operations",
      "zero-trust architecture continuous authentication",
      
      // Company Values
      "QuantumForge Manifesto innovation first scientific rigor global impact",
      "52% women in technical roles 48% in leadership positions",
      "STEM Education Initiative free quantum computing education"
    ];
    
    let vectorAnalysis: any = {
      totalQueries: testQueries.length,
      results: [],
      qualityMetrics: {}
    };
    
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      logSubStep(`Testing query ${i + 1}/${testQueries.length}`, `"${query}"`);
      
      try {
        const vectorResponse = await api.post("/vectors/search", {
          query: query,
          agentId: TEST_AGENT_ID
        });
        
        const results = vectorResponse.data?.data || [];
        const queryAnalysis = {
          query: query,
          resultCount: results.length,
          topScore: results.length > 0 ? results[0].score : 0,
          avgScore: results.length > 0 ? results.reduce((sum: number, r: any) => sum + r.score, 0) / results.length : 0,
          highQualityResults: results.filter((r: any) => r.score > 0.5).length,
          relevantSources: [...new Set(results.map((r: any) => r.sourceId))].length
        };
        
        vectorAnalysis.results.push(queryAnalysis);
        
        logSubStep(`  Results:`, {
          found: results.length,
          topScore: queryAnalysis.topScore.toFixed(4),
          avgScore: queryAnalysis.avgScore.toFixed(4),
          highQuality: queryAnalysis.highQualityResults,
          sources: queryAnalysis.relevantSources
        });
        
        // Show top 2 results for detailed analysis
        if (results.length > 0) {
          results.slice(0, 2).forEach((result: any, idx: number) => {
            logSubStep(`    Result ${idx + 1}:`, {
              score: result.score.toFixed(4),
              sourceId: result.sourceId,
              chunkIndex: result.chunkIndex,
              textPreview: result.text?.substring(0, 100) + "..."
            });
          });
        }
        
      } catch (error) {
        logError(`Query ${i + 1} failed`, error);
        vectorAnalysis.results.push({
          query: query,
          error: error,
          resultCount: 0
        });
      }
    }
    
    // Calculate overall vector quality metrics
    const successfulQueries = vectorAnalysis.results.filter((r: any) => !r.error);
    const avgResultCount = successfulQueries.reduce((sum: number, r: any) => sum + r.resultCount, 0) / successfulQueries.length;
    const avgTopScore = successfulQueries.reduce((sum: number, r: any) => sum + r.topScore, 0) / successfulQueries.length;
    const avgAvgScore = successfulQueries.reduce((sum: number, r: any) => sum + r.avgScore, 0) / successfulQueries.length;
    const totalHighQuality = successfulQueries.reduce((sum: number, r: any) => sum + r.highQualityResults, 0);
    
    vectorAnalysis.qualityMetrics = {
      successRate: `${(successfulQueries.length / testQueries.length * 100).toFixed(1)}%`,
      avgResultsPerQuery: avgResultCount.toFixed(1),
      avgTopScore: avgTopScore.toFixed(4),
      avgAvgScore: avgAvgScore.toFixed(4),
      totalHighQualityResults: totalHighQuality,
      coverageScore: avgResultCount >= 5 ? "Excellent" : avgResultCount >= 3 ? "Good" : "Limited"
    };
    
    logSubStep("Vector Quality Summary:", vectorAnalysis.qualityMetrics);
    
    trainingMetrics.vectorAnalysis = vectorAnalysis;
    
    // STEP 5: Chunking Analysis
    logStep("CHUNKING ANALYSIS", "Analyzing text chunking effectiveness across all sources");
    
    // Analyze chunks through vector search results for all sources
    const allChunksQuery = await api.post("/vectors/search", {
      query: "QuantumForge Technologies complete profile overview",
      agentId: TEST_AGENT_ID
    });
    
    const allChunks = allChunksQuery.data?.data || [];
    
    if (allChunks.length > 0) {
      const chunkSizes = allChunks.map((chunk: any) => chunk.text?.length || 0);
      const avgChunkSize = chunkSizes.reduce((sum: number, size: number) => sum + size, 0) / chunkSizes.length;
      const minChunkSize = Math.min(...chunkSizes);
      const maxChunkSize = Math.max(...chunkSizes);
      
      // Analyze source distribution
      const sourceIds = [...new Set(allChunks.map((chunk: any) => chunk.sourceId))];
      const chunksPerSource = sourceIds.map(sourceId => ({
        sourceId,
        chunkCount: allChunks.filter((chunk: any) => chunk.sourceId === sourceId).length
      }));
      
      const chunkingAnalysis = {
        totalChunks: allChunks.length,
        uniqueSources: sourceIds.length,
        avgChunkSize: Math.round(avgChunkSize),
        minChunkSize: minChunkSize,
        maxChunkSize: maxChunkSize,
        chunkSizeVariation: maxChunkSize - minChunkSize,
        avgChunksPerSource: Math.round(allChunks.length / sourceIds.length),
        chunksPerSource: chunksPerSource
      };
      
      logSubStep("Chunking Effectiveness:", chunkingAnalysis);
      
      // Analyze chunk content distribution
      let hasFounders = 0, hasQScript = 0, hasCompanyInfo = 0, hasTechnical = 0;
      
      allChunks.forEach((chunk: any) => {
        const text = chunk.text?.toLowerCase() || "";
        if (text.includes("elena vasquez") || text.includes("marcus chen")) hasFounders++;
        if (text.includes("qscript")) hasQScript++;
        if (text.includes("founded") || text.includes("2017")) hasCompanyInfo++;
        if (text.includes("quantum") && text.includes("algorithm")) hasTechnical++;
      });
      
      const contentDistribution = {
        foundersInfo: `${hasFounders}/${allChunks.length} chunks`,
        qscriptInfo: `${hasQScript}/${allChunks.length} chunks`,
        companyInfo: `${hasCompanyInfo}/${allChunks.length} chunks`,
        technicalInfo: `${hasTechnical}/${allChunks.length} chunks`
      };
      
      logSubStep("Content Distribution:", contentDistribution);
      
      // Analyze document coverage by testing specific sections
      const documentSections = {
        founding: ["Elena Vasquez", "Marcus Chen", "Mount Ararat", "2017"],
        technology: ["Ararat Crystal", "Crystal Lattice Entanglement", "Q3 Harmony"],
        products: ["QuantumForge Cloud", "QuantumForge Nexus", "QScript"],
        research: ["Project Phoenix", "Project Atlas", "Project Genesis"],
        manufacturing: ["Crystal Growth Facility", "50000 square meters", "annual production"],
        partnerships: ["MIT", "PharmaCorp", "Department of Defense"],
        future: ["quantum internet", "Q4 Infinity", "2030 vision"],
        culture: ["Crystal Code", "QuantumForge Academy", "Green Quantum Initiative"]
      };
      
      let sectionCoverage: any = {};
      
      for (const [section, keywords] of Object.entries(documentSections)) {
        let sectionHits = 0;
        let totalPossible = keywords.length;
        
        for (const keyword of keywords) {
          const keywordQuery = await api.post("/vectors/search", {
            query: keyword,
            agentId: TEST_AGENT_ID
          });
          const keywordResults = keywordQuery.data?.data || [];
          if (keywordResults.length > 0 && keywordResults[0].score > 0.3) {
            sectionHits++;
          }
        }
        
        sectionCoverage[section] = {
          coverage: `${sectionHits}/${totalPossible} keywords found`,
          percentage: Math.round((sectionHits / totalPossible) * 100)
        };
      }
      
      logSubStep("Document Section Coverage:", sectionCoverage);
      
      // Calculate overall document coverage score
      const coveragePercentages = Object.values(sectionCoverage).map((s: any) => s.percentage);
      const avgCoverage = coveragePercentages.reduce((sum: number, p: number) => sum + p, 0) / coveragePercentages.length;
      
      trainingMetrics.chunking = {
        ...chunkingAnalysis,
        contentDistribution: contentDistribution,
        documentCoverage: sectionCoverage,
        overallDocumentCoverage: `${Math.round(avgCoverage)}%`,
        qualityScore: avgCoverage > 80 ? "Excellent" : avgCoverage > 60 ? "Good" : "Needs Improvement"
      };
    } else {
      logWarning("No chunks found in vector database");
      trainingMetrics.chunking = { error: "No chunks found" };
    }
    
    // STEP 6: Performance Summary
    logStep("PERFORMANCE SUMMARY", "Overall training pipeline assessment");
    
    const totalTime = Date.now() - authStartTime;
    
    const performanceSummary = {
      overallTime: `${totalTime}ms`,
      authTime: `${trainingMetrics.auth.time}ms`,
      
      // Quality metrics
      vectorQuality: trainingMetrics.vectorAnalysis?.qualityMetrics?.coverageScore || "Unknown",
      chunkingQuality: trainingMetrics.chunking?.qualityScore || "Unknown",
      documentCoverage: trainingMetrics.chunking?.overallDocumentCoverage || "Unknown",
      
      // Success indicators
      vectorSearchSuccess: trainingMetrics.vectorAnalysis?.qualityMetrics?.successRate || "0%",
      
      // Current state
      totalSources: trainingMetrics.existingSources?.count || 0,
      embeddedSources: trainingMetrics.existingSources?.embedded || 0,
      embeddingRate: trainingMetrics.existingSources?.count > 0 ? 
        `${((trainingMetrics.existingSources.embedded / trainingMetrics.existingSources.count) * 100).toFixed(1)}%` : "0%",
      
      // Optimization recommendations
      recommendations: [] as string[]
    };
    
    // Generate optimization recommendations
    const recommendations: string[] = [];
    
    if (parseFloat(trainingMetrics.vectorAnalysis?.qualityMetrics?.avgTopScore || "0") < 0.6) {
      recommendations.push("Average top score < 0.6 - consider improving chunking strategy");
    }
    
    if (trainingMetrics.chunking?.totalChunks && trainingMetrics.chunking.totalChunks < 5) {
      recommendations.push("Low chunk count - consider smaller chunk sizes for better granularity");
    }
    
    if (trainingMetrics.chunking?.avgChunkSize > 1500) {
      recommendations.push("Large average chunk size - consider reducing for better precision");
    }
    
    if (trainingMetrics.existingSources?.embedded === 0) {
      recommendations.push("No embedded sources found - ensure training has been completed");
    }
    
    performanceSummary.recommendations = recommendations.length > 0 ? recommendations : ["Pipeline performance looks optimal"];
    
    logSubStep("📊 OVERALL PERFORMANCE:", performanceSummary);
    
    // STEP 7: Detailed Metrics Export
    logStep("METRICS EXPORT", "Saving detailed analysis for optimization");
    
    const detailedMetrics = {
      timestamp: new Date().toISOString(),
      testConfig: {
        agentId: TEST_AGENT_ID,
        analysisType: "comprehensive_chunking_test",
        totalTestQueries: testQueries.length
      },
      metrics: trainingMetrics,
      performance: performanceSummary,
      testQueries: testQueries,
      rawResults: vectorAnalysis.results
    };
    
    // Save to file for analysis
    const metricsPath = path.join(process.cwd(), `chunking-analysis-${Date.now()}.json`);
    fs.writeFileSync(metricsPath, JSON.stringify(detailedMetrics, null, 2));
    
    logSubStep("Metrics saved to", metricsPath);
    logSubStep("Use this data for chunking optimization");
    
    // STEP 8: Final Recommendations
    logStep("OPTIMIZATION RECOMMENDATIONS", "Next steps for chunking improvement");
    
    console.log("\n📈 === CHUNKING OPTIMIZATION OPPORTUNITIES ===");
    
    if (recommendations.length > 0) {
      console.log("🔧 Immediate Actions:");
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log("\n🎯 Chunking Testing Recommendations:");
    console.log("   1. Analyze document coverage gaps - focus on sections with <70% coverage");
    console.log("   2. Test different chunk sizes (current avg: " + 
      (trainingMetrics.chunking?.avgChunkSize || "unknown") + " chars)");
    console.log("   3. Test overlap percentages to improve context preservation");
    console.log("   4. Compare semantic vs fixed-length chunking strategies");
    console.log("   5. Monitor chunk retrieval relevance scores");
    
    console.log("\n🔬 Advanced Chunking Analysis:");
    console.log("   1. A/B test different chunking algorithms (sentence, paragraph, semantic)");
    console.log("   2. Analyze chunk boundary quality - are related concepts split?");
    console.log("   3. Test hierarchical chunking (summaries + detailed chunks)");
    console.log("   4. Benchmark against different embedding models for chunk quality");
    console.log("   5. Implement dynamic chunk sizing based on content complexity");
    
    console.log("\n✅ === COMPREHENSIVE CHUNKING ANALYSIS COMPLETE ===");
    console.log(`📊 Document Coverage: ${trainingMetrics.chunking?.overallDocumentCoverage || "Unknown"}`);
    console.log(`⏱️  Total Analysis Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`📁 Detailed metrics saved: ${metricsPath}`);
    
  } catch (error) {
    console.log("\n❌ === ANALYSIS FAILED ===");
    console.error("Error:", error instanceof Error ? error.message : String(error));
    
    // Save partial metrics even on failure
    if (Object.keys(trainingMetrics).length > 0) {
      const errorMetricsPath = path.join(process.cwd(), `training-metrics-error-${Date.now()}.json`);
      fs.writeFileSync(errorMetricsPath, JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        partialMetrics: trainingMetrics,
        timestamp: new Date().toISOString()
      }, null, 2));
      console.log(`Partial metrics saved: ${errorMetricsPath}`);
    }
  }
}

// Run the comprehensive analysis
analyzeTrainingPipeline().catch(console.error);