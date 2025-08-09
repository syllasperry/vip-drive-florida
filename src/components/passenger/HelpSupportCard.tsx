
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, Phone, Mail, MessageCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface HelpSupportCardProps {
  onClose: () => void;
}

export const HelpSupportCard = ({ onClose }: HelpSupportCardProps) => {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!email || !subject || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit your request.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Support Request Sent",
      description: "We'll get back to you within 24 hours.",
    });

    setMessage("");
    setEmail("");
    setSubject("");
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Help & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Help Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Call Support</div>
              <div className="text-sm text-muted-foreground">(555) 123-4567</div>
            </div>
          </Button>

          <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Live Chat</div>
              <div className="text-sm text-muted-foreground">Available 24/7</div>
            </div>
          </Button>

          <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">FAQ</div>
              <div className="text-sm text-muted-foreground">Common questions</div>
            </div>
          </Button>

          <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Email Support</div>
              <div className="text-sm text-muted-foreground">support@vip-drive.com</div>
            </div>
          </Button>
        </div>

        {/* Contact Form */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-medium">Send us a message</h3>
          
          <div className="space-y-2">
            <Label htmlFor="support-email">Your Email</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-subject">Subject</Label>
            <Input
              id="support-subject"
              placeholder="How can we help you?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              placeholder="Describe your issue or question in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSubmit}>Send Message</Button>
        </div>
      </CardContent>
    </Card>
  );
};
