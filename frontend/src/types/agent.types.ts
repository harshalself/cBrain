// Agent Types and Interfaces

export type TrainingStatus = 'idle' | 'pending' | 'in-progress' | 'completed' | 'failed';

export type AIProvider = 'groq' | 'openai' | 'anthropic' | 'cohere';

export interface Agent {
    id: number;
    name: string;
    description?: string;
    provider: AIProvider;
    model: string;
    temperature: number;
    system_prompt: string;
    is_active: number;
    user_id: number;
    training_status: TrainingStatus;
    training_progress: number;
    training_error?: string;
    embedded_sources_count: number;
    total_sources_count: number;
    created_at: string;
    updated_at: string;
    trained_on?: string;
}

export interface CreateAgentDto {
    name: string;
    description?: string;
    provider: AIProvider;
    api_key: string;
    model?: string;
    temperature?: number;
    system_prompt?: string;
    is_active?: number;
}

export interface UpdateAgentDto {
    name?: string;
    description?: string;
    provider?: AIProvider;
    api_key?: string;
    model?: string;
    temperature?: number;
    system_prompt?: string;
    is_active?: number;
}

export interface TrainingAnalytics {
    total_documents: number;
    processed_documents: number;
    failed_documents: number;
    total_chunks: number;
    average_chunk_size: number;
    training_duration?: number;
}

export interface TrainingStatusResponse {
    status: TrainingStatus;
    progress: number;
    error?: string;
    current_step?: string;
}

export interface TrainAgentDto {
    source_ids?: number[];
    chunk_size?: number;
    chunk_overlap?: number;
}

// Provider-specific model configurations
export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
    groq: [
        "moonshotai/kimi-k2-instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
    ],
    openai: [],
    anthropic: [],
    cohere: []
};

// System prompt templates
export const SYSTEM_PROMPT_TEMPLATES = {
    helpful_assistant: 'You are a helpful AI assistant. Provide accurate, informative responses while being concise and clear.',
    customer_support: 'You are a customer support agent. Be friendly, empathetic, and solution-oriented. Always acknowledge the customer\'s concern before providing assistance.',
    hr_assistant: 'You are an HR assistant. Provide accurate information about company policies, benefits, and procedures. Always maintain professionalism and confidentiality.',
    technical_expert: 'You are a technical expert. Provide detailed technical information and solutions. Use clear examples and diagrams when helpful.',
};
