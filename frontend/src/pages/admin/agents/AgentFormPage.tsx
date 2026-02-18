import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import agentService from '@/services/agentService';
import { AIProvider, CreateAgentDto, UpdateAgentDto, SYSTEM_PROMPT_TEMPLATES } from '@/types/agent.types';
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
    const { user: authUser } = useAuth();
    const user = authUser ? {
        id: authUser.id.toString(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: authUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: authUser.created_at || new Date().toISOString(),
        status: 'active' as const,
    } : null;
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
    const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const initializeData = async () => {
            setIsFetching(true);
            try {
                // Fetch dynamic models from backend
                const modelsData = await agentService.getProviderModels();
                const groupedModels: Record<string, string[]> = {};

                modelsData.forEach((item: any) => {
                    if (!groupedModels[item.provider]) {
                        groupedModels[item.provider] = [];
                    }
                    groupedModels[item.provider].push(item.model_name);
                });

                setAvailableModels(groupedModels);

                // Load agent data if in edit mode
                if (isEditMode && id) {
                    await loadAgent(parseInt(id));
                } else if (groupedModels['groq']?.length > 0) {
                    // Pre-select first model for default provider
                    setFormData(prev => ({
                        ...prev,
                        model: groupedModels['groq'][0]
                    }));
                }
            } catch (err: any) {
                toast.error('Failed to initialize provider models');
                console.error(err);
            } finally {
                setIsFetching(false);
            }
        };

        initializeData();
    }, [id, isEditMode]);

    useEffect(() => {
        // Set default model when provider changes
        if (formData.provider && availableModels[formData.provider]?.length > 0) {
            // Only update if current model is not in the new provider's list
            if (!availableModels[formData.provider].includes(formData.model)) {
                setFormData(prev => ({
                    ...prev,
                    model: availableModels[formData.provider][0]
                }));
            }
        }
    }, [formData.provider, availableModels]);

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
                temperature: Number(agent.temperature ?? 0.7),
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

        if (formData.temperature < 0 || formData.temperature > 1) {
            newErrors.temperature = 'Temperature must be between 0 and 1';
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

            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/agents')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Agents</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                {isEditMode ? 'Edit Agent' : 'Create New Agent'}
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                {isEditMode ? 'Update your AI assistant configuration' : 'Configure your new AI assistant'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-5xl">
                    <div className="glass rounded-3xl p-8 space-y-10 border border-border/50 shadow-2xl">
                        {/* Basic Information */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-6 bg-primary rounded-full" />
                                <h3 className="text-xl font-bold text-foreground">Basic Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80 px-1">
                                        Agent Name <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.name ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50`}
                                        placeholder="e.g., HR Assistant"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80 px-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="w-full h-[46px] px-4 bg-secondary/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="What this agent does..."
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="mt-6 flex items-center gap-4 bg-secondary/10 p-4 rounded-2xl w-fit">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-secondary/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-sm"></div>
                                </label>
                                <span className="text-sm font-bold text-foreground">Active and Ready</span>
                            </div>
                        </section>

                        <div className="h-px bg-border/50" />

                        {/* Provider Configuration */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-6 bg-primary rounded-full" />
                                <h3 className="text-xl font-bold text-foreground">Provider Configuration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Provider */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80 px-1">
                                        AI Provider <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={formData.provider}
                                        onChange={(e) => handleInputChange('provider', e.target.value as AIProvider)}
                                        className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.provider ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none capitalize cursor-pointer`}
                                    >
                                        {Object.keys(availableModels)
                                            .map((provider) => (
                                                <option key={provider} value={provider} className="capitalize bg-card text-foreground">
                                                    {provider}
                                                </option>
                                            ))}
                                    </select>
                                    {errors.provider && (
                                        <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.provider}</p>
                                    )}
                                </div>

                                {/* API Key */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80 px-1">
                                        API Key {!isEditMode && <span className="text-destructive">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.api_key}
                                        onChange={(e) => handleInputChange('api_key', e.target.value)}
                                        className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.api_key ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm placeholder:text-muted-foreground/50`}
                                        placeholder={isEditMode ? "••••••••••••••••" : "Enter API key"}
                                    />
                                    {errors.api_key && (
                                        <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.api_key}</p>
                                    )}
                                </div>

                                {/* Model */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80 px-1">
                                        Model <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={formData.model}
                                        onChange={(e) => handleInputChange('model', e.target.value)}
                                        className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.model ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer`}
                                    >
                                        {availableModels[formData.provider]?.map((model) => (
                                            <option key={model} value={model} className="bg-card text-foreground">
                                                {model}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.model && (
                                        <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.model}</p>
                                    )}
                                </div>

                                {/* Temperature */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-sm font-semibold text-foreground/80">
                                            Temperature (Creativity)
                                        </label>
                                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                            {Number(formData.temperature ?? 0.7).toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="pt-3 pb-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={formData.temperature}
                                            onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-secondary/30 rounded-full appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-1">
                                        <span>Precise</span>
                                        <span>Balanced</span>
                                        <span>Creative</span>
                                    </div>
                                    {errors.temperature && (
                                        <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.temperature}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-border/50" />

                        {/* System Prompt */}
                        <section className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 bg-primary rounded-full" />
                                    <h3 className="text-xl font-bold text-foreground">System Prompt</h3>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                                    {Object.keys(SYSTEM_PROMPT_TEMPLATES).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => applyTemplate(key as keyof typeof SYSTEM_PROMPT_TEMPLATES)}
                                            className="whitespace-nowrap px-4 py-2 text-xs font-bold bg-secondary/30 hover:bg-primary hover:text-primary-foreground rounded-xl transition-all border border-border/50 capitalize shadow-sm"
                                        >
                                            {key.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/80 px-1">
                                    Instructions for the Agent <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={formData.system_prompt}
                                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                                    className={`w-full px-5 py-4 bg-secondary/20 border ${errors.system_prompt ? 'border-destructive' : 'border-border'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[200px] font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 ring-offset-background`}
                                    placeholder="Define how the AI agent should behave, its personality, and its core tasks..."
                                />
                                {errors.system_prompt && (
                                    <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.system_prompt}</p>
                                )}
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="flex items-center gap-4 pt-6 border-t border-border/30">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 h-[52px] bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>{isEditMode ? 'Update Configuration' : 'Create Agent'}</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/agents')}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none px-10 h-[52px] border border-border bg-background/50 text-foreground rounded-xl font-bold hover:bg-secondary/50 transition-all disabled:opacity-50 active:scale-95"
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
