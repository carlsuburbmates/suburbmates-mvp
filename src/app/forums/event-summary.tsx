"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { summarizeEvents } from "@/ai/flows/summarize-events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type EventSummaryProps = {
  eventDetails: string;
};

export function EventSummary({ eventDetails }: EventSummaryProps) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const result = await summarizeEvents({ eventDetails });
      setSummary(result.summary);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error summarizing event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate summary. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleSummarize} disabled={isLoading} variant="secondary">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        AI Summary
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline">
              <Sparkles className="text-primary w-5 h-5" />
              Event Summary
            </DialogTitle>
            <DialogDescription className="pt-4 text-left text-base text-foreground">
              {summary}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
