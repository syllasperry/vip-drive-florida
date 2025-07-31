import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ContributorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: 'individual' | 'business'; name: string }) => void;
  title: string;
  initialData?: { type: 'individual' | 'business'; name: string } | null;
}

export const ContributorInfoModal = ({ isOpen, onClose, onSubmit, title, initialData }: ContributorInfoModalProps) => {
  const [contributorType, setContributorType] = useState<'individual' | 'business'>('individual');
  const [name, setName] = useState('');

  // Pre-fill with initial data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      setContributorType(initialData.type);
      setName(initialData.name);
    } else if (isOpen) {
      setContributorType('individual');
      setName('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({ type: contributorType, name: name.trim() });
      setName('');
      setContributorType('individual');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Contributor Type</Label>
            <RadioGroup value={contributorType} onValueChange={(value) => setContributorType(value as 'individual' | 'business')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business">Business</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="name" className="text-base font-medium">
              {contributorType === 'individual' ? 'Full Name' : 'Company Name'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={contributorType === 'individual' ? 'Enter your full name' : 'Enter company name'}
              className="mt-2"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()} className="flex-1">
              Generate PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};