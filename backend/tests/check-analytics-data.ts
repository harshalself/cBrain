import knex from '../database/index.schema';

async function checkAnalyticsData() {
  try {
    console.log('🔍 Checking analytics data in database...\n');

    // Check chat_analytics table
    const chatAnalytics = await knex('chat_analytics')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);

    console.log('📊 Chat Analytics Table:');
    console.log('Total records:', chatAnalytics.length);
    if (chatAnalytics.length > 0) {
      chatAnalytics.forEach((record, index) => {
        console.log(`${index + 1}. Agent ${record.agent_id}, Session ${record.session_id}`);
        console.log(`   Messages: ${record.message_count}, Response Time: ${record.response_time_ms}ms`);
        console.log(`   Cost: $${record.cost_estimate}, Context Used: ${record.context_used}`);
        console.log(`   Created: ${record.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No data in chat_analytics table');
    }

    // Check user_activity_events table
    const userActivity = await knex('user_activity_events')
      .select('*')
      .where('event_type', 'like', '%CHAT%')
      .orderBy('created_at', 'desc')
      .limit(10);

    console.log('📈 User Activity Events Table:');
    console.log('Total chat events:', userActivity.length);
    if (userActivity.length > 0) {
      userActivity.forEach((event, index) => {
        console.log(`${index + 1}. ${event.event_type} - Agent ${event.event_data?.agentId}`);
        console.log(`   Response Time: ${event.event_data?.responseTime}ms`);
        console.log(`   Token Count: ${event.event_data?.tokenCount}`);
        console.log(`   Created: ${event.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No chat events in user_activity_events table');
    }

    // Check agent_performance_metrics table
    const agentMetrics = await knex('agent_performance_metrics')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(5);

    console.log('🎯 Agent Performance Metrics Table:');
    console.log('Total records:', agentMetrics.length);
    if (agentMetrics.length > 0) {
      agentMetrics.forEach((metric, index) => {
        console.log(`${index + 1}. Agent ${metric.agent_id} on ${metric.date}`);
        console.log(`   Chats: ${metric.total_chats}, Messages: ${metric.total_messages}`);
        console.log(`   Avg Response Time: ${metric.avg_response_time_ms}ms`);
        console.log(`   Total Cost: $${metric.total_cost}`);
        console.log('');
      });
    } else {
      console.log('❌ No data in agent_performance_metrics table');
    }

  } catch (error) {
    console.error('❌ Error checking analytics data:', error);
  } finally {
    await knex.destroy();
  }
}

checkAnalyticsData();