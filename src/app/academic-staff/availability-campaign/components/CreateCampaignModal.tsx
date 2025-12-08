import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCampaignMutation } from '@/services/availabilityCampaignApi';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

interface CreateCampaignForm {
    title: string;
    deadline: string;
}

export default function CreateCampaignModal() {
    const [open, setOpen] = useState(false);
    const [createCampaign, { isLoading }] = useCreateCampaignMutation();
    const { register, handleSubmit, reset } = useForm<CreateCampaignForm>();

    const onSubmit = async (data: CreateCampaignForm) => {
        try {
            await createCampaign({
                title: data.title,
                deadline: new Date(data.deadline).toISOString(),
            }).unwrap();
            toast.success('Campaign created successfully');
            setOpen(false);
            reset();
        } catch {
            toast.error('Failed to create campaign');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Availability Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Campaign Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., December 2025 Availability Update"
                            {...register('title', { required: true })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                            id="deadline"
                            type="datetime-local"
                            {...register('deadline', { required: true })}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
