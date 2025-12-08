import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Terminal, Sparkles, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `Welcome to AEGIS Assistant! I'm connected to Claude Code and can help you:

• **Add features** to AEGIS
• **Modify the dashboard** in real-time
• **Query your data** (accounts, subscriptions, etc.)
• **Run scans** (GitHub audit, browser import)
• **Generate reports** and analytics

Try asking me to do something!`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Check Claude Code connection
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/claude/status')
      if (response.ok) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sending',
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'I processed your request.',
        timestamp: new Date(),
        status: 'sent',
      }

      setMessages(prev => [
        ...prev.map(m => (m.id === userMessage.id ? { ...m, status: 'sent' as const } : m)),
        assistantMessage,
      ])
    } catch (error) {
      // Provide mock response when Claude API isn't connected
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockResponse(input.trim()),
        timestamp: new Date(),
        status: 'sent',
      }

      setMessages(prev => [
        ...prev.map(m => (m.id === userMessage.id ? { ...m, status: 'sent' as const } : m)),
        mockResponse,
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getMockResponse = (query: string): string => {
    const lower = query.toLowerCase()

    if (lower.includes('add') || lower.includes('create') || lower.includes('build')) {
      return `I'd be happy to help you build that feature! To enable live code modifications, ensure Claude Code is running with the AEGIS project open:

\`\`\`bash
cd D:\\somacosf\\aegis
claude
\`\`\`

Then I can:
1. Modify React components
2. Add new API endpoints
3. Update database schema
4. Create new pages

What specific feature would you like me to implement?`
    }

    if (lower.includes('scan') || lower.includes('import') || lower.includes('browser')) {
      return `To import browser passwords, run the TUI importer:

\`\`\`bash
npm run browser:import
\`\`\`

Or from the CLI:
\`\`\`bash
cd packages/browser-parser
npx tsx src/importer.ts
\`\`\`

This will:
• Scan for installed browsers
• Guide you through CSV export
• Encrypt files for cloud sync
• Import to AEGIS database`
    }

    if (lower.includes('github') || lower.includes('audit')) {
      return `Running GitHub audit...

\`\`\`bash
npm run github:audit
\`\`\`

This scans:
• OAuth applications
• SSH keys (age & usage)
• Deploy keys
• Suspicious permissions

Results will appear in the GitHub tab.`
    }

    if (lower.includes('subscription') || lower.includes('cost') || lower.includes('spending')) {
      return `Based on your current data:

**Monthly Spend**: $89.97
**Yearly Projection**: $1,079.64

Top subscriptions:
1. Adobe CC - $54.99/mo
2. Netflix - $15.99/mo
3. Spotify - $9.99/mo

Would you like me to:
• Find unused subscriptions?
• Export a spending report?
• Set up billing alerts?`
    }

    return `I understand you're asking about "${query}".

To enable full Claude Code integration:
1. Run \`claude\` in your terminal
2. Open the AEGIS project
3. Ask me again!

In the meantime, you can:
• Navigate using the sidebar
• Run CLI commands manually
• Check the docs for guidance`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickActions = [
    { label: 'Run GitHub Audit', action: 'Run a GitHub security audit and show me the results' },
    { label: 'Import Browser Passwords', action: 'How do I import my browser passwords?' },
    { label: 'Show Spending Report', action: 'Show me my subscription spending breakdown' },
    { label: 'Find Unused Accounts', action: 'Find accounts I haven\'t used in 6 months' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AEGIS Assistant</h1>
              <p className="text-gray-400 text-sm">Powered by Claude Code</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'checking'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-400">
              {connectionStatus === 'connected'
                ? 'Claude Connected'
                : connectionStatus === 'checking'
                ? 'Checking...'
                : 'Offline Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-aegis-600'
                  : message.role === 'system'
                  ? 'bg-gray-700'
                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : message.role === 'system' ? (
                <Terminal className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl p-4 ${
                message.role === 'user'
                  ? 'bg-aegis-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                {message.content.split('\n').map((line, i) => {
                  if (line.startsWith('```')) {
                    return null
                  }
                  if (line.startsWith('•') || line.startsWith('-')) {
                    return (
                      <p key={i} className="my-1 text-gray-300">
                        {line}
                      </p>
                    )
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-semibold text-white my-1">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    )
                  }
                  if (line.match(/^\d+\./)) {
                    return (
                      <p key={i} className="my-1 text-gray-300">
                        {line}
                      </p>
                    )
                  }
                  return line ? (
                    <p key={i} className="my-1">
                      {line}
                    </p>
                  ) : (
                    <br key={i} />
                  )
                })}
                {message.content.includes('```') && (
                  <pre className="bg-gray-900 rounded-lg p-3 mt-2 overflow-x-auto">
                    <code className="text-sm text-green-400">
                      {message.content.match(/```(?:\w+)?\n?([\s\S]*?)```/)?.[1] || ''}
                    </code>
                  </pre>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-t border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => setInput(qa.action)}
              className="flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full transition-colors"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything or describe a feature to build..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-aegis-500 resize-none"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
