import knex from '../database/index.schema';

async function checkAgentSources() {
  try {
    console.log('🔍 Checking sources for Agent 3...\n');

    // Check sources for agent 3
    const sources = await knex('sources')
      .where({ agent_id: 3 })
      .select('id', 'name', 'source_type', 'status', 'is_embedded', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    console.log('📊 Sources found:', sources.length);
    if (sources.length === 0) {
      console.log('❌ No sources found for Agent 3');
      return;
    }

    sources.forEach((source, index) => {
      console.log(`${index + 1}. ID: ${source.id}`);
      console.log(`   Name: ${source.name}`);
      console.log(`   Type: ${source.source_type}`);
      console.log(`   Status: ${source.status}`);
      console.log(`   Embedded: ${source.is_embedded}`);
      console.log(`   Created: ${source.created_at}`);
      console.log('');
    });

    // Check file sources specifically
    const fileSources = sources.filter(s => s.source_type === 'file');
    console.log('📁 File sources:', fileSources.length);

    if (fileSources.length > 0) {
      console.log('📋 File source details:');
      for (const source of fileSources) {
        const fileSource = await knex('file_sources').where({ source_id: source.id }).first();
        if (fileSource) {
          console.log(`  - File: ${fileSource.file_name}`);
          console.log(`    Size: ${fileSource.file_size} bytes`);
          console.log(`    Path: ${fileSource.file_path}`);
          console.log(`    Uploaded: ${fileSource.created_at}`);
          console.log('');
        }
      }
    }

    // Check if there are any vectors stored (look for agent training status)
    console.log('🔍 Checking for training status...');

    // Check agent training status
    const agent = await knex('agents')
      .where({ id: 3 })
      .select('id', 'name', 'training_status', 'created_at', 'updated_at')
      .first();

    if (agent) {
      console.log('🤖 Agent training status:', agent.training_status);
      console.log('📅 Last updated:', agent.updated_at);
    } else {
      console.log('❌ Agent not found');
    }

  } catch (error) {
    console.error('❌ Error checking sources:', error);
  } finally {
    await knex.destroy();
  }
}

checkAgentSources();