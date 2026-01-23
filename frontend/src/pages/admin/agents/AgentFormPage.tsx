import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getCurrentUser } from '@/lib/mockData';
import agentService from '@/services/agentService';
import { AIProvider, CreateAgentDto, UpdateAgentDto, PROVIDER_MODELS, SYSTEM_PROMPT_TEMPLATES } from '@/types/agent.types';
import { ArrowLeft, Loader2, Save, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
    name: string;
    description: string;
    provider: AIProvider;
    api_key: string;
    model: string;
    temperature: number;
    system_prompt: string;
    is_active: boolean;
}

interface FormErrors {
    name?: string;
    provider?: string;
    api_key?: string;
    model?: string;
    temperature?: string;
    system_prompt?: string;
}

const AgentFormPage: React.FC = () => {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        provider: 'groq',
        api_key: '',
        model: '',
        temperature: 0.7,
        system_prompt: '',
        is_active: true,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isEditMode && id) {
            loadAgent(parseInt(id));
        }
    }, [id, isEditMode]);

    useEffect(() => {
        // Set default model when provider changes
        if (formData.provider && PROVIDER_MODELS[formData.provider]?.length > 0) {
            setFormData(prev => ({
                ...prev,
                model: prev.model || PROVIDER_MODELS[formData.provider][0]
            }));
        }
    }, [formData.provider]);

    const loadAgent = async (agentId: number) => {
        try {
            setIsFetching(true);
            const agent = await agentService.getAgent(agentId);
            setFormData({
                name: agent.name,
                description: agent.description || '',
                provider: agent.provider,
                api_key: '', // Don't populate API key for security
                model: agent.model,
                temperature: agent.temperature,
                system_prompt: agent.system_prompt,
                is_active: Boolean(agent.is_active),
            });
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load agent';
            toast.error(errorMsg);
            navigate('/admin/agents');
        } finally {
            setIsFetching(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Agent name is required';
        }

        if (!formData.provider) {
            newErrors.provider = 'Provider is required';
        }

        if (!isEditMode && !formData.api_key.trim()) {
            newErrors.api_key = 'API key is required';
        }

        if (!formData.model) {
            newErrors.model = 'Model is required';
        }

        if (formData.temperature < 0 || formData.temperature > 2) {
            newErrors.temperature = 'Temperature must be between 0 and 2';
        }

        if (!formData.system_prompt.trim()) {
            newErrors.system_prompt = 'System prompt is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            setIsLoading(true);

            if (isEditMode && id) {
                const updateData: UpdateAgentDto = {
                    name: formData.name,
                    description: formData.description,
                    provider: formData.provider,
                    model: formData.model,
                    temperature: formData.temperature,
                    system_prompt: formData.system_prompt,
                    is_active: formData.is_active ? 1 : 0,
                };

                // Only include API key if provided
                if (formData.api_key.trim()) {
                    updateData.api_key = formData.api_key;
                }

                await agentService.updateAgent(parseInt(id), updateData);
                toast.success('Agent updated successfully');
            } else {
                const createData: CreateAgentDto = {
                    name: formData.name,
                    description: formData.description,
                    provider: formData.provider,
                    api_key: formData.api_key,
                    model: formData.model,
                    temperature: formData.temperature,
                    system_prompt: formData.system_prompt,
                    is_active: formData.is_active ? 1 : 0,
                };

                await agentService.createAgent(createData);
                toast.success('Agent created successfully');
            }

            navigate('/admin/agents');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} agent`;
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const applyTemplate = (templateKey: keyof typeof SYSTEM_PROMPT_TEMPLATES) => {
        setFormData(prev => ({
            ...prev,
            system_prompt: SYSTEM_PROMPT_TEMPLATES[templateKey]
        }));
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Agent Management" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading agent...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader title="Agent Management" user={user} />

            <div className="flex-1 p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin/agents')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Agents
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {isEditMode ? 'Edit Agent' : 'Create New Agent'}
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                {isEditMode ? 'Update your AI assistant configuration' : 'Configure your new AI assistant'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-4xl">
                    <div className="glass rounded-2xl p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Agent Name <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`w-full px-4 py-2 bg-background border ${errors.name ? 'border-destructive' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
                                        placeholder="e.g., HR Assistant"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Brief description of what this agent does"
                                    />
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                    <span className="text-sm text-foreground">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Provider Configuration */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">Provider Configuration</h3>
                            <div className="space-y-4">
                                {/* Provider */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        AI Provider <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={formData.provider}
                                        onChange={(e) => handleInputChange('provider', e.target.value as AIProvider)}
                                        className={`w-full px-4 py-2 bg-background border ${errors.provider ? 'border-destructive' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary capitalize`}
                                    >
                                        {Object.keys(PROVIDER_MODELS).map((provider) => (
                                            <option key={provider} value={provider} className="capitalize">
                                                {provider}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.provider && (
                                        <p className="text-sm text-destructive mt-1">{errors.provider}</p>
                                    )}
                                </div>

                                {/* API Key */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        API Key {!isEditMode && <span className="text-destructive">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.api_key}
                                        onChange={(e) => handleInputChange('api_key', e.target.value)}
                                        className={`w-full px-4 py-2 bg-background border ${errors.api_key ? 'border-destructive' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm`}
                                        placeholder={isEditMode ? "Leave blank to keep existing key" : "Enter your API key"}
                                    />
                                    {errors.api_key && (
                                        <p className="text-sm text-destructive mt-1">{errors.api_key}</p>
                                    )}
                                </div>

                                {/* Model */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Model <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={formData.model}
                                        onChange={(e) => handleInputChange('model', e.target.value)}
                                        className={`w-full px-4 py-2 bg-background border ${errors.model ? 'border-destructive' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
                                    >
                                        {PROVIDER_MODELS[formData.provider]?.map((model) => (
                                            <option key={model} value={model}>
                                                {model}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.model && (
                                        <p className="text-sm text-destructive mt-1">{errors.model}</p>
                                    )}
                                </div>

                                {/* Temperature */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Temperature: {formData.temperature}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={formData.temperature}
                                        onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>More Focused</span>
                                        <span>More Creative</span>
                                    </div>
                                    {errors.temperature && (
                                        <p className="text-sm text-destructive mt-1">{errors.temperature}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* System Prompt */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">System Prompt</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.keys(SYSTEM_PROMPT_TEMPLATES).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => applyTemplate(key as keyof typeof SYSTEM_PROMPT_TEMPLATES)}
                                            className="px-3 py-1 text-xs bg-accent hover:bg-accent/80 rounded-lg transition-colors capitalize"
                                        >
                                            {key.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    System Prompt <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={formData.system_prompt}
                                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                                    className={`w-full px-4 py-3 bg-background border ${errors.system_prompt ? 'border-destructive' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] font-mono text-sm`}
                                    placeholder="Define how the AI agent should behave..."
                                />
                                {errors.system_prompt && (
                                    <p className="text-sm text-destructive mt-1">{errors.system_prompt}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {isEditMode ? 'Update Agent' : 'Create Agent'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/agents')}
                                disabled={isLoading}
                                className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentFormPage;
