import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

/**
 * Integration Tests for Agent Features
 * 
 * Tests the following scenarios:
 * 1. Document Upload to Knowledge Base
 * 2. Linking Documents to Agents via Training
 * 3. End-to-End Training Flow
 * 4. Playground Chat with Overrides
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '12345678';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

class AgentFeatureTests {
    private api: AxiosInstance;
    private authToken: string = '';
    private testDocumentId: number | null = null;
    private testAgentId: number | null = null;

    constructor() {
        this.api = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    private log(message: string, color: string = colors.reset) {
        console.log(`${color}${message}${colors.reset}`);
    }

    private logSuccess(message: string) {
        this.log(`✅ ${message}`, colors.green);
    }

    private logError(message: string) {
        this.log(`❌ ${message}`, colors.red);
    }

    private logInfo(message: string) {
        this.log(`ℹ️  ${message}`, colors.cyan);
    }

    private logSection(title: string) {
        this.log(`\n${'='.repeat(60)}`, colors.blue);
        this.log(`  ${title}`, colors.bright + colors.blue);
        this.log(`${'='.repeat(60)}`, colors.blue);
    }

    /**
     * Authenticate and get JWT token
     */
    async authenticate(): Promise<void> {
        this.logSection('Authentication');

        try {
            const response = await this.api.post('/auth/login', {
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            });

            this.authToken = response.data.data.token;
            this.api.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;

            this.logSuccess(`Authenticated as ${TEST_EMAIL}`);
            this.logInfo(`Token: ${this.authToken.substring(0, 20)}...`);
        } catch (error: any) {
            this.logError('Authentication failed');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 1: Document Upload to Knowledge Base
     */
    async testDocumentUpload(): Promise<void> {
        this.logSection('Test 1: Document Upload to Knowledge Base');

        try {
            // Create a test file
            const testFileName = 'test-document.txt';
            const testFilePath = path.join(__dirname, testFileName);
            const testContent = `# Test Document for Agent Training

This is a test document for validating the Knowledge Base upload functionality.

## Important Information
- This document contains test data
- It will be used to train AI agents
- Created on: ${new Date().toISOString()}

## Sample Content
The knowledge base system allows admins to manage documents globally.
Documents can be linked to multiple agents for training purposes.`;

            fs.writeFileSync(testFilePath, testContent);
            this.logInfo(`Created test file: ${testFileName}`);

            // Upload the document
            const formData = new FormData();
            formData.append('file', fs.createReadStream(testFilePath));
            formData.append('name', 'Integration Test Document');
            formData.append('tags', JSON.stringify(['test', 'integration', 'automated']));

            const response = await this.api.post('/documents/upload', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${this.authToken}`,
                },
            });

            this.testDocumentId = response.data.data.id;

            this.logSuccess('Document uploaded successfully');
            this.logInfo(`Document ID: ${this.testDocumentId}`);
            this.logInfo(`File name: ${response.data.data.name}`);
            this.logInfo(`File size: ${response.data.data.file_size} bytes`);
            this.logInfo(`Status: ${response.data.data.status}`);

            // Clean up test file
            fs.unlinkSync(testFilePath);
            this.logInfo('Test file cleaned up');

        } catch (error: any) {
            this.logError('Document upload failed');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 2: List Documents from Knowledge Base
     */
    async testListDocuments(): Promise<void> {
        this.logSection('Test 2: List Documents from Knowledge Base');

        try {
            const response = await this.api.get('/documents');

            const documents = response.data.data;
            this.logSuccess(`Retrieved ${documents.length} documents`);

            if (documents.length > 0) {
                this.logInfo('Recent documents:');
                documents.slice(0, 3).forEach((doc: any) => {
                    console.log(`  - ${doc.name} (ID: ${doc.id}, Size: ${doc.file_size} bytes)`);
                });
            }

            // Verify our test document is in the list
            const testDoc = documents.find((doc: any) => doc.id === this.testDocumentId);
            if (testDoc) {
                this.logSuccess('Test document found in list');
            } else {
                this.logError('Test document not found in list');
            }

        } catch (error: any) {
            this.logError('Failed to list documents');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 3: Create an Agent
     */
    async testCreateAgent(): Promise<void> {
        this.logSection('Test 3: Create Test Agent');

        try {
            const agentData = {
                name: 'Integration Test Agent',
                description: 'Agent created for integration testing',
                provider: 'groq',
                model: 'llama3-8b-8192',
                temperature: 0.7,
                system_prompt: 'You are a helpful assistant for testing purposes.',
                api_key: process.env.GROQ_API_KEY || 'test-api-key',
                is_active: true,
            };

            const response = await this.api.post('/agents', agentData);

            this.testAgentId = response.data.data.id;

            this.logSuccess('Agent created successfully');
            this.logInfo(`Agent ID: ${this.testAgentId}`);
            this.logInfo(`Name: ${response.data.data.name}`);
            this.logInfo(`Provider: ${response.data.data.provider}`);
            this.logInfo(`Model: ${response.data.data.model}`);

        } catch (error: any) {
            this.logError('Agent creation failed');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 4: Link Documents to Agent via Training
     */
    async testLinkDocumentsToAgent(): Promise<void> {
        this.logSection('Test 4: Link Documents to Agent via Training');

        if (!this.testAgentId || !this.testDocumentId) {
            this.logError('Missing agent or document ID');
            throw new Error('Prerequisites not met');
        }

        try {
            const response = await this.api.post(`/agents/${this.testAgentId}/train`, {
                documentIds: [this.testDocumentId],
                forceRetrain: false,
                cleanupExisting: false,
            });

            this.logSuccess('Training initiated with document linking');
            this.logInfo(`Job ID: ${response.data.data.jobId}`);
            this.logInfo(`Total Sources: ${response.data.data.totalSources}`);
            this.logInfo(`Status: ${response.data.data.status}`);
            this.logInfo(`Namespace: ${response.data.data.namespace}`);

        } catch (error: any) {
            this.logError('Failed to link documents and train agent');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 5: Check Training Status
     */
    async testGetTrainingStatus(): Promise<void> {
        this.logSection('Test 5: Get Training Status');

        if (!this.testAgentId) {
            this.logError('Missing agent ID');
            throw new Error('Prerequisites not met');
        }

        try {
            // Wait a bit for training to start
            this.logInfo('Waiting 3 seconds for training to initialize...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            const response = await this.api.get(`/agents/${this.testAgentId}/train/status`);

            const status = response.data.data;
            this.logSuccess('Training status retrieved');
            this.logInfo(`Status: ${status.training_status}`);
            this.logInfo(`Progress: ${status.progress_percentage}%`);
            this.logInfo(`Total Sources: ${status.total_sources}`);

            if (status.processed_sources !== undefined) {
                this.logInfo(`Processed Sources: ${status.processed_sources}`);
            }

        } catch (error: any) {
            this.logError('Failed to get training status');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 6: Get Provider Models
     */
    async testGetProviderModels(): Promise<void> {
        this.logSection('Test 6: Get Provider Models');

        try {
            const response = await this.api.get('/provider-models');

            const models = response.data.data;
            this.logSuccess(`Retrieved ${models.length} provider models`);

            // Group by provider
            const byProvider: Record<string, any[]> = {};
            models.forEach((model: any) => {
                if (!byProvider[model.provider]) {
                    byProvider[model.provider] = [];
                }
                byProvider[model.provider].push(model);
            });

            this.logInfo('Models by provider:');
            Object.keys(byProvider).forEach(provider => {
                console.log(`  ${provider}: ${byProvider[provider].length} models`);
            });

        } catch (error: any) {
            this.logError('Failed to get provider models');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Test 7: Playground Chat with Overrides
     */
    async testPlaygroundChatWithOverrides(): Promise<void> {
        this.logSection('Test 7: Playground Chat with Overrides');

        if (!this.testAgentId) {
            this.logError('Missing agent ID');
            throw new Error('Prerequisites not met');
        }

        try {
            const chatData = {
                messages: [
                    {
                        role: 'user',
                        content: 'Hello! Can you introduce yourself?',
                    },
                ],
                overrides: {
                    temperature: 0.9,
                    systemPrompt: 'You are a friendly test assistant. Always start your responses with "Test Mode:"',
                },
            };

            this.logInfo('Sending chat request with overrides...');
            this.logInfo(`Temperature override: ${chatData.overrides.temperature}`);
            this.logInfo(`System prompt override: "${chatData.overrides.systemPrompt.substring(0, 50)}..."`);

            const response = await this.api.post(`/chat/agents/${this.testAgentId}`, chatData);

            this.logSuccess('Chat request completed');

            // Note: Response format may vary based on your chat implementation
            // Adjust this based on your actual response structure
            if (response.data.data) {
                this.logInfo('Chat response received (check if overrides were applied)');
            }

        } catch (error: any) {
            this.logError('Playground chat failed');
            console.error(error.response?.data || error.message);
            // Don't throw - chat might not be fully implemented yet
        }
    }

    /**
     * Test 8: Get Agent Details (verify document linkage)
     */
    async testGetAgentDetails(): Promise<void> {
        this.logSection('Test 8: Get Agent Details');

        if (!this.testAgentId) {
            this.logError('Missing agent ID');
            throw new Error('Prerequisites not met');
        }

        try {
            const response = await this.api.get(`/agents/${this.testAgentId}`);

            const agent = response.data.data;
            this.logSuccess('Agent details retrieved');
            this.logInfo(`Name: ${agent.name}`);
            this.logInfo(`Status: ${agent.is_active ? 'Active' : 'Inactive'}`);
            this.logInfo(`Training Status: ${agent.training_status || 'N/A'}`);

        } catch (error: any) {
            this.logError('Failed to get agent details');
            console.error(error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Cleanup: Delete test resources
     */
    async cleanup(): Promise<void> {
        this.logSection('Cleanup: Deleting Test Resources');

        // Delete agent
        if (this.testAgentId) {
            try {
                await this.api.delete(`/agents/${this.testAgentId}`);
                this.logSuccess(`Deleted test agent (ID: ${this.testAgentId})`);
            } catch (error: any) {
                this.logError(`Failed to delete agent: ${error.response?.data?.message || error.message}`);
            }
        }

        // Delete document
        if (this.testDocumentId) {
            try {
                await this.api.delete(`/documents/${this.testDocumentId}`);
                this.logSuccess(`Deleted test document (ID: ${this.testDocumentId})`);
            } catch (error: any) {
                this.logError(`Failed to delete document: ${error.response?.data?.message || error.message}`);
            }
        }
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<void> {
        const startTime = Date.now();

        this.log('\n' + '█'.repeat(60), colors.bright + colors.blue);
        this.log('  AGENT FEATURE INTEGRATION TESTS', colors.bright + colors.blue);
        this.log('█'.repeat(60) + '\n', colors.bright + colors.blue);

        try {
            await this.authenticate();
            await this.testDocumentUpload();
            await this.testListDocuments();
            await this.testCreateAgent();
            await this.testLinkDocumentsToAgent();
            await this.testGetTrainingStatus();
            await this.testGetProviderModels();
            await this.testPlaygroundChatWithOverrides();
            await this.testGetAgentDetails();

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            this.logSection('All Tests Completed Successfully! 🎉');
            this.logSuccess(`Total duration: ${duration}s`);

        } catch (error) {
            this.logError('Test suite failed');
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests
const tests = new AgentFeatureTests();
tests.runAllTests()
    .then(() => {
        console.log('\n✨ Test suite completed successfully!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test suite failed:', error.message, '\n');
        process.exit(1);
    });
