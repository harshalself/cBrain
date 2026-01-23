/**
 * Test script to verify vector configuration is working correctly
 */
import { vectorConfig } from '../src/config/vector.config';
import { searchConfig } from '../src/config/search.config';
import { cacheConfig } from '../src/config/feature-cache.config';

console.log('🧪 Testing Vector Configuration...\n');

// Test chunking config
console.log('📄 Chunking Configuration:');
console.log(`  - Default Strategy: ${vectorConfig.chunking.defaultStrategy}`);
console.log(`  - Min Chunk Size: ${vectorConfig.chunking.minChunkSize}`);
console.log(`  - Max Chunk Size: ${vectorConfig.chunking.maxChunkSize}`);
console.log(`  - Enable Overlap: ${vectorConfig.chunking.enableOverlap}`);
console.log(`  - Overlap Percentage: ${vectorConfig.chunking.overlapPercentage}%`);

// Test embedding config
console.log('\n🤖 Embedding Configuration:');
console.log(`  - Model: ${vectorConfig.embedding.modelName}`);
console.log(`  - Dimensions: ${vectorConfig.embedding.dimensions}`);
console.log(`  - Max Batch Size: ${vectorConfig.embedding.maxBatchSize}`);
console.log(`  - Max Text Length: ${vectorConfig.embedding.maxTextLength}`);

// Test search config
console.log('\n🔍 Search Configuration:');
console.log(`  - Default TopK: ${searchConfig.parameters.defaultTopK}`);
console.log(`  - Dense Weight: ${searchConfig.hybrid.defaultDenseWeight}`);
console.log(`  - Sparse Weight: ${searchConfig.hybrid.defaultSparseWeight}`);
console.log(`  - Min Similarity: ${searchConfig.parameters.defaultMinSimilarity}`);

// Test reranking config
console.log('\n🎯 Reranking Configuration:');
console.log(`  - Default Model: ${searchConfig.reranking.defaultModel}`);
console.log(`  - Score Threshold: ${searchConfig.reranking.scoreThreshold}`);
console.log(`  - Max Candidates: ${searchConfig.reranking.maxCandidates}`);

// Test cache config
console.log('\n💾 Cache Configuration:');
console.log(`  - Search Results TTL: ${cacheConfig.vector.search.searchResultsTTL}s`);
console.log(`  - Vector Count TTL: ${cacheConfig.vector.statistics.vectorCountTTL}s`);
console.log(`  - Vector Availability TTL: ${cacheConfig.vector.statistics.vectorAvailabilityTTL}s`);

console.log('\n✅ Vector configuration test completed successfully!');