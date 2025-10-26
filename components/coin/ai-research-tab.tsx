'use client';

import { useState, useEffect, useRef } from 'react';
import { StartupData } from '@/types/startup';
import { Send, Download, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIResearchTabProps {
  startup: StartupData;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ResearchData {
  summary: string;
  detailed_analysis: string;
  pdf_report_path?: string;
  timestamp: string;
}

export function AIResearchTab({ startup }: AIResearchTabProps) {
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResearch();
  }, [startup.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      
      // Prepare company data for the agent
      const companyData = {
        id: startup.id,
        name: startup.name,
        symbol: startup.ticker,
        description: startup.elevatorPitch,
        website: startup.website || '',
        twitter: startup.twitter || '',
        discord: startup.discord || '',
        telegram: startup.telegram || '',
        team: startup.team || [],
        traction: startup.traction || []
      };

      const response = await fetch('/api/ai-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          launchpadPubkey: startup.id,
          company: companyData 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch research');
      }

      const data = await response.json();
      setResearch(data);
    } catch (error) {
      console.error('Error fetching research:', error);
      setResearch({
        summary: 'Unable to load AI research at this time. Please try again later.',
        detailed_analysis: '',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMessage }
    ];
    setChatMessages(newMessages);
    setSendingMessage(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: startup.id,
          message: userMessage,
          chatHistory: chatMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add assistant response to chat
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: data.response }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: 'I apologize, but I\'m having trouble processing your question right now.' }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      
      // Get PDF URL from research data
      const pdfUrl = research?.pdf_url;
      if (!pdfUrl) {
        alert('PDF report is not available yet. Please try again in a moment.');
        return;
      }
      
      // Construct full URL (bridge URL + pdf path)
      const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `http://localhost:8000${pdfUrl}`;
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${startup.name.replace(/\s+/g, '_')}_AI_Research_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing company with AI...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* LEFT: Research Summary Section */}
      <div className="flex-1 overflow-y-auto border-r border-border">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">AI Research Analysis</h2>
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Download PDF Report
            </button>
          </div>

          {/* Summary Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {research?.summary || 'No summary available'}
              </p>
            </div>
          </div>

          {/* Detailed Analysis Card */}
          {research?.detailed_analysis && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {research.detailed_analysis}
                </p>
              </div>
            </div>
          )}

          {/* Social Media Data Card */}
          {research?.social_media_data && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Social Media Analysis</h3>
              <div className="text-sm text-foreground/80">
                <p className="mb-2">{research.social_media_data.summary}</p>
                {research.social_media_data.platforms_found && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {research.social_media_data.platforms_found.map((platform: string) => (
                      <span key={platform} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> This research is powered by Fetch.ai agents and Claude AI. 
              Not financial advice. Conduct your own due diligence.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Chat Section */}
      <div className="w-96 flex flex-col min-h-0 bg-card/50">
        <div className="border-b border-border px-6 py-3 bg-card/30">
          <h3 className="text-lg font-semibold">Ask Questions</h3>
          <p className="text-sm text-muted-foreground">Chat with AI about this company</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ask me anything about {startup.name}
              </p>
            </div>
          ) : (
            <>
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot size={18} className="text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {sendingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-border px-6 py-4 bg-card/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about the company..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={sendingMessage}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || sendingMessage}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

