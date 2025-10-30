'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { summarizeDiscussion } from '@/ai/flows/summarize-discussions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type DiscussionSummaryProps = {
  discussionText: string
}

export function DiscussionSummary({ discussionText }: DiscussionSummaryProps) {
  const [summary, setSummary] = useState<ReactNode>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleSummarize = async () => {
    setIsLoading(true)
    try {
      const result = await summarizeDiscussion({ discussionText })
      // Format summary into a list
      const formattedSummary = result.summary
        .split(/(\n-|\*)/)
        .map((s) => s.trim())
        .filter((s) => s && s !== '-' && s !== '*')
        .map((item, index) => (
          <li key={index} className="mb-2">
            {item}
          </li>
        ))

      setSummary(<ul>{formattedSummary}</ul>)
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error summarizing discussion:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate summary. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Alert className="bg-accent/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <AlertTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Too long? Get a quick summary!
          </AlertTitle>
          <AlertDescription>
            Use our AI tool to get the key points from this discussion.
          </AlertDescription>
        </div>
        <Button
          onClick={handleSummarize}
          disabled={isLoading || !discussionText}
          className="w-full md:w-auto mt-2 md:mt-0 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate AI Summary
        </Button>
      </Alert>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-xl">
              <Sparkles className="text-primary w-5 h-5" />
              Discussion Summary
            </DialogTitle>
            <DialogDescription asChild>
              <div className="prose prose-sm pt-4 text-left text-base text-foreground prose-li:text-foreground">
                {summary}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
