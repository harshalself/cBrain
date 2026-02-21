// Local form types for AgentFormPage

import { AIProvider } from '@/types/agent.types';

export interface FormData {
    name: string;
    description: string;
    provider: AIProvider;
    api_key: string;
    model: string;
    temperature: number;
    system_prompt: string;
    is_active: boolean;
}

export interface FormErrors {
    name?: string;
    provider?: string;
    api_key?: string;
    model?: string;
    temperature?: string;
    system_prompt?: string;
}

export type ActiveTab = 'config' | 'training';
