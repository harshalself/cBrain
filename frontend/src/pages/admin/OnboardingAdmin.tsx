import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getCurrentUser } from '@/lib/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnboardingStatus from '@/components/onboarding/OnboardingStatus';
import TemplateEditor from '@/components/onboarding/TemplateEditor';

const OnboardingAdmin: React.FC = () => {
    const user = getCurrentUser();

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Onboarding Management" user={user} />

            <div className="p-6 lg:p-8">
                <Tabs defaultValue="status" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="status">User Status</TabsTrigger>
                        <TabsTrigger value="template">Template Editor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="status">
                        <OnboardingStatus />
                    </TabsContent>

                    <TabsContent value="template">
                        <TemplateEditor />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default OnboardingAdmin;
