'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Removed direct import of server flow to avoid client/server compilation issues
// import { supportChat } from '@/ai/flows/support-chat';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
};

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom when new messages are added
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: inputValue,
            sender: 'user',
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/support-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMessage.text })
            });
            const data = await res.json();
            const botMessage: Message = {
                id: `bot-${Date.now()}`,
                text: data.response ?? 'No response',
                sender: 'bot',
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = {
                id: `bot-error-${Date.now()}`,
                text: "Sorry, I'm having trouble connecting. Please try again in a moment.",
                sender: 'bot',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Chat"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                </Button>
            </div>
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm">
                    <Card className="flex flex-col h-[60vh] shadow-2xl">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <Bot className="text-primary" /> Suburbmates Support
                            </CardTitle>
                            <CardDescription>
                                Ask me questions about our platform and policies.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                             <ScrollArea className="h-full" ref={scrollAreaRef as any}>
                                <div className="p-4 space-y-4">
                                     <div className={cn(
                                        "flex items-end gap-2",
                                        "justify-start"
                                    )}>
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary-foreground max-w-xs">
                                            <p className="text-sm text-foreground">Hi there! How can I help you today?</p>
                                        </div>
                                    </div>
                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "flex items-end gap-2",
                                                message.sender === 'user' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {message.sender === 'user' ? (
                                                <div className="p-2 rounded-lg bg-primary text-primary-foreground max-w-xs">
                                                    <p className="text-sm">{message.text}</p>
                                                </div>
                                            ) : (
                                                <div className="p-2 rounded-lg bg-muted max-w-xs">
                                                     <p className="text-sm text-foreground whitespace-pre-wrap">{message.text}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-end gap-2 justify-start">
                                            <div className="p-3 rounded-lg bg-muted">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <div className="p-4 border-t">
                             <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your question..."
                                    disabled={isLoading}
                                />
                                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
