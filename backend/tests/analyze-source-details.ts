#!/usr/bin/env tsx

import knex from '../database/index.schema';
import { chatbotIndex } from '../src/utils/pinecone';

async function analyzeSourceDetails() {
  try {
    console.log('🔍 COMPREHENSIVE SOURCE ANALYSIS\n');
    console.log('=' .repeat(60));

    const sourceName = 'quantumforge-knowledge-base.txt';
    const agentId = 3;
    const userId = 1;

    // 1. Get source details from sources table
    console.log('1️⃣ SOURCE TABLE DATA');
    console.log('-'.repeat(30));

    const source = await knex('sources')
      .where({ name: sourceName, agent_id: agentId })
      .select('*')
      .first();

    if (!source) {
      console.log('❌ Source not found in database');
      return;
    }

    console.log(`📄 Source ID: ${source.id}`);
    console.log(`📄 Name: ${source.name}`);
    console.log(`📄 Type: ${source.source_type}`);
    console.log(`📄 Status: ${source.status}`);
    console.log(`📄 Is Embedded: ${source.is_embedded}`);
    console.log(`📄 Agent ID: ${source.agent_id}`);
    console.log(`📄 Description: ${source.description || 'No description'}`);
    console.log(`📄 Created By: ${source.created_by}`);
    console.log(`📄 Created At: ${source.created_at}`);
    console.log(`📄 Updated By: ${source.updated_by || 'N/A'}`);
    console.log(`📄 Updated At: ${source.updated_at}`);
    console.log(`📄 Is Deleted: ${source.is_deleted}`);
    console.log(`📄 Deleted By: ${source.deleted_by || 'N/A'}`);
    console.log(`📄 Deleted At: ${source.deleted_at || 'N/A'}`);

    // 2. Get file-specific details
    console.log('\n2️⃣ FILE SOURCE DETAILS');
    console.log('-'.repeat(30));

    const fileSource = await knex('file_sources')
      .where({ source_id: source.id })
      .select('*')
      .first();

    if (fileSource) {
      console.log(`📁 File Source ID: ${fileSource.id}`);
      console.log(`📁 Source ID: ${fileSource.source_id}`);
      console.log(`📁 File URL: ${fileSource.file_url}`);
      console.log(`📁 MIME Type: ${fileSource.mime_type || 'Unknown'}`);
      console.log(`📁 File Size: ${fileSource.file_size} bytes (${(fileSource.file_size / 1024).toFixed(2)} KB)`);
      console.log(`📁 Text Content Length: ${fileSource.text_content ? fileSource.text_content.length : 0} characters`);

      if (fileSource.text_content) {
        const lines = fileSource.text_content.split('\n').length;
        const words = fileSource.text_content.split(/\s+/).length;
        console.log(`📁 Text Content Stats: ${lines} lines, ${words} words`);
        console.log(`📁 Content Preview (first 200 chars):`);
        console.log(`"${fileSource.text_content.substring(0, 200)}..."`);
      }
    } else {
      console.log('❌ No file source details found');
    }

    // 3. Get agent information
    console.log('\n3️⃣ AGENT INFORMATION');
    console.log('-'.repeat(30));

    const agent = await knex('agents')
      .where({ id: agentId })
      .select('*')
      .first();

    if (agent) {
      console.log(`🤖 Agent ID: ${agent.id}`);
      console.log(`🤖 Name: ${agent.name}`);
      console.log(`🤖 User ID: ${agent.user_id}`);
      console.log(`🤖 Model: ${agent.model}`);
      console.log(`🤖 Temperature: ${agent.temperature}`);
      console.log(`🤖 System Prompt: ${agent.system_prompt ? agent.system_prompt.substring(0, 100) + '...' : 'None'}`);
      console.log(`🤖 Training Status: ${agent.training_status}`);
      console.log(`🤖 Created At: ${agent.created_at}`);
      console.log(`🤖 Updated At: ${agent.updated_at}`);
      console.log(`🤖 Is Deleted: ${agent.is_deleted}`);
    }

    // 4. Get vector store statistics
    console.log('\n4️⃣ VECTOR STORE STATISTICS');
    console.log('-'.repeat(30));

    try {
      const namespaceName = `user_${userId}_agent_${agentId}`;
      console.log(`🔀 Namespace: ${namespaceName}`);

      // Get global index stats
      const globalStats = await chatbotIndex.describeIndexStats();
      console.log(`🌐 Global Index Stats:`);
      console.log(`   📊 Total Records: ${globalStats.totalRecordCount}`);
      console.log(`   📊 Dimension: ${globalStats.dimension}`);
      console.log(`   📊 Index Fullness: ${globalStats.indexFullness || 'N/A'}`);

      // Get namespace-specific stats
      const namespaceStats = globalStats.namespaces?.[namespaceName];
      if (namespaceStats) {
        console.log(`🏠 Namespace Stats:`);
        console.log(`   📊 Record Count: ${namespaceStats.recordCount}`);
      } else {
        console.log(`🏠 Namespace Stats: No data found for namespace ${namespaceName}`);
      }

      // Try to query some vectors to get metadata
      console.log(`\n🔍 Sample Vector Metadata:`);
      try {
        const queryResponse = await chatbotIndex.namespace(namespaceName).query({
          vector: new Array(2048).fill(0), // Zero vector to get any results
          topK: 3,
          includeMetadata: true,
          includeValues: false
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
          console.log(`   📊 Found ${queryResponse.matches.length} sample vectors:`);
          queryResponse.matches.forEach((match, index) => {
            console.log(`   ${index + 1}. Vector ID: ${match.id}`);
            console.log(`      Score: ${match.score}`);
            if (match.metadata) {
              console.log(`      Source ID: ${match.metadata.sourceId}`);
              console.log(`      Source Type: ${match.metadata.sourceType}`);
              console.log(`      Chunk Index: ${match.metadata.chunkIndex}/${match.metadata.totalChunks}`);
              console.log(`      Chunk Quality: ${match.metadata.chunkQuality}`);
              console.log(`      Content Freshness: ${match.metadata.contentFreshness}`);
              console.log(`      Source Name: ${match.metadata.sourceName}`);
              console.log(`      Document Title: ${match.metadata.documentTitle}`);
              const textPreview = typeof match.metadata.text === 'string'
                ? `"${match.metadata.text.substring(0, 100)}..."`
                : 'N/A (not text)';
              console.log(`      Text Preview: ${textPreview}`);
            }
            console.log('');
          });
        } else {
          console.log(`   📊 No vectors found in this namespace`);
        }
      } catch (queryError) {
        console.log(`   ❌ Error querying vectors: ${queryError}`);
      }

    } catch (pineconeError) {
      console.log(`❌ Error accessing Pinecone: ${pineconeError}`);
    }

    // 5. Get chat analytics for this agent
    console.log('\n5️⃣ CHAT ANALYTICS');
    console.log('-'.repeat(30));

    const chatAnalytics = await knex('chat_analytics')
      .where({ agent_id: agentId })
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);

    console.log(`📊 Total chat sessions: ${chatAnalytics.length}`);
    if (chatAnalytics.length > 0) {
      console.log(`📋 Recent sessions:`);
      chatAnalytics.forEach((session, index) => {
        console.log(`   ${index + 1}. Session ${session.session_id}:`);
        console.log(`      Messages: ${session.message_count}`);
        console.log(`      Context Used: ${session.context_used}`);
        console.log(`      Context Length: ${session.context_length}`);
        console.log(`      Response Time: ${session.response_time_ms}ms`);
        console.log(`      Created: ${session.created_at}`);
        console.log('');
      });
    }

    // 6. Get agent performance metrics
    console.log('\n6️⃣ AGENT PERFORMANCE METRICS');
    console.log('-'.repeat(30));

    const performanceMetrics = await knex('agent_performance_metrics')
      .where({ agent_id: agentId })
      .select('*')
      .orderBy('date', 'desc')
      .limit(7); // Last 7 days

    console.log(`📊 Performance records: ${performanceMetrics.length}`);
    if (performanceMetrics.length > 0) {
      performanceMetrics.forEach((metric, index) => {
        console.log(`   ${metric.date}:`);
        console.log(`      Total Chats: ${metric.total_chats}`);
        console.log(`      Total Messages: ${metric.total_messages}`);
        console.log(`      Avg Response Time: ${metric.avg_response_time_ms}ms`);
        console.log(`      Total Tokens: ${metric.total_tokens_consumed}`);
        console.log(`      Total Cost: $${metric.total_cost}`);
        console.log(`      Source First Blocks: ${metric.source_first_blocks}`);
        console.log(`      Errors: ${metric.error_count}`);
        console.log('');
      });
    }

    // 7. Get user activity events related to this source/agent
    console.log('\n7️⃣ USER ACTIVITY EVENTS');
    console.log('-'.repeat(30));

    const activityEvents = await knex('user_activity_events')
      .where({ user_id: userId })
      .whereRaw("event_data->>'agentId' = ?", [agentId.toString()])
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);

    console.log(`📊 Activity events: ${activityEvents.length}`);
    if (activityEvents.length > 0) {
      activityEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.event_type} at ${event.created_at}`);
        console.log(`      Data: ${JSON.stringify(event.event_data, null, 2)}`);
        console.log('');
      });
    }

    // 8. Summary
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Source "${sourceName}" Analysis Complete`);
    console.log(`📊 Database Status: ${source.status}`);
    console.log(`📊 Embedding Status: ${source.is_embedded ? 'Embedded' : 'Not Embedded'}`);
    console.log(`📊 Agent Training: ${agent?.training_status || 'Unknown'}`);
    console.log(`📊 File Size: ${fileSource?.file_size || 0} bytes`);
    console.log(`📊 Text Content: ${fileSource?.text_content?.length || 0} characters`);
    console.log(`📊 Chat Sessions: ${chatAnalytics.length}`);
    console.log(`📊 Total Messages: ${performanceMetrics.reduce((sum, m) => sum + m.total_messages, 0)}`);

  } catch (error) {
    console.error('❌ Error analyzing source:', error);
  } finally {
    await knex.destroy();
  }
}

analyzeSourceDetails();