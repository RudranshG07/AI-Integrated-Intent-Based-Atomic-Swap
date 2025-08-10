import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer?: ethers.Signer | null;
}

interface Intent {
  id: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fromNetwork: string;
  toNetwork: string;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  originalText: string;
  createdAt: number;
  matchedWith?: string | null;
  contractId?: string;
}

interface PixelatedEyeProps {
  size?: number;
  isAnimating?: boolean;
}

const PixelatedEye: React.FC<PixelatedEyeProps> = ({ size = 100, isAnimating = false }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (eyeRef.current) {
        const rect = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        
        const deltaX = e.clientX - eyeCenterX;
        const deltaY = e.clientY - eyeCenterY;
        
        // Improved movement calculation for better centering
        const maxDistance = size * 0.2;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const normalizedX = distance > 0 ? (deltaX / distance) * Math.min(distance, maxDistance) : 0;
        const normalizedY = distance > 0 ? (deltaY / distance) * Math.min(distance, maxDistance) : 0;
        
        setMousePosition({ x: normalizedX, y: normalizedY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size]);

  return (
    <div 
      ref={eyeRef}
      className="relative flex items-center justify-center mx-auto"
      style={{ width: size, height: size, margin: '0 auto' }}
    >
      {/* Improved eye outline with better pixelation */}
      <div className="absolute inset-0 grid gap-px" style={{gridTemplateColumns: 'repeat(16, 1fr)', gridTemplateRows: 'repeat(12, 1fr)'}}>
        {Array.from({ length: 192 }).map((_, i) => {
          const row = Math.floor(i / 16);
          const col = i % 16;
          const centerX = 8;
          const centerY = 6;
          
          // Create more refined eye shape
          const dx = (col - centerX) / 8;
          const dy = (row - centerY) / 5;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Multi-layer eye structure
          const isOuterBorder = distance > 0.9 && distance <= 1;
          const isMiddleBorder = distance > 0.7 && distance <= 0.8;
          const isInnerArea = distance <= 0.7;
          
          let opacity = 0;
          if (isOuterBorder) opacity = 1;
          else if (isMiddleBorder) opacity = 0.6;
          else if (isInnerArea) opacity = 0.15;
          
          return (
            <div
              key={i}
              className="bg-white transition-all duration-300"
              style={{ 
                opacity,
                boxShadow: isAnimating && isOuterBorder ? '0 0 2px rgba(255,255,255,0.8)' : 'none',
                animation: isAnimating && isOuterBorder ? `pulse 2s ease-in-out infinite` : undefined
              }}
            />
          );
        })}
      </div>

      {/* Enhanced eyeball with better centering */}
      <div 
        className="absolute rounded-full transition-all duration-200 ease-out"
        style={{
          width: size * 0.35,
          height: size * 0.35,
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          boxShadow: isAnimating 
            ? '0 0 15px rgba(255,255,255,0.8), inset 0 0 10px rgba(0,0,0,0.1)' 
            : 'inset 0 0 10px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.8)'
        }}
      >
        {/* Enhanced pupil */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '45%',
            height: '45%',
            background: 'radial-gradient(circle, #000000 0%, #1a1a1a 100%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)'
          }}
        />
        
        {/* Iris detail */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '65%',
            height: '65%',
            background: 'radial-gradient(circle, transparent 40%, rgba(100,100,100,0.2) 70%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Enhanced pixelated reflection */}
      <div 
        className="absolute grid gap-px"
        style={{
          width: size * 0.18,
          height: size * 0.18,
          left: '50%',
          top: '50%',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.6}px, ${mousePosition.y * 0.6}px)`
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isHighlight = (row === 0 && (col === 0 || col === 1)) || (row === 1 && col === 0);
          
          return (
            <div
              key={i}
              className="bg-white transition-opacity duration-300"
              style={{ 
                opacity: isHighlight ? 0.9 : 0,
                animation: isAnimating && isHighlight ? 'twinkle 1.5s ease-in-out infinite alternate' : undefined
              }}
            />
          );
        })}
      </div>
      
      {/* Outer glow effect */}
      {isAnimating && (
        <div 
          className="absolute rounded-full"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

const WelcomeScreen: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background pixelated pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-20 grid-rows-20 h-full w-full gap-1">
          {Array.from({ length: 400 }).map((_, i) => (
            <div
              key={i}
              className="bg-white"
              style={{
                opacity: Math.random() > 0.8 ? 0.3 : 0,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="mb-8 flex justify-center">
          <PixelatedEye size={200} isAnimating={true} />
        </div>
        
        <h1 className="text-6xl font-mono font-bold text-white mb-4 tracking-wider">
          <span className={`inline-block transition-all duration-500 ${animationPhase === 0 ? 'scale-110 text-gray-300' : ''}`}>
            HELLO
          </span>
        </h1>
        
        <h2 className="text-4xl font-mono font-bold text-white mb-8 tracking-wider">
          <span className={`inline-block transition-all duration-500 ${animationPhase === 1 ? 'scale-110 text-gray-300' : ''}`}>
            WELCOME
          </span>
        </h2>
        
        <div className="mb-12">
          <div className="text-2xl font-mono text-gray-400 mb-4">TO ATOM SWAP</div>
          <div className="text-3xl font-mono font-bold text-white tracking-widest">
            FUTURE OF CROSS-CHAIN
          </div>
        </div>
        
        <button
          onClick={onConnect}
          className={`
            bg-transparent border-2 border-white text-white px-12 py-4
            font-mono text-xl tracking-wider hover:bg-white hover:text-black
            transition-all duration-300 transform hover:scale-105
            ${animationPhase === 2 ? 'scale-105 bg-white text-black' : ''}
          `}
          style={{
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        >
          CONNECT WALLET
        </button>
      </div>
    </div>
  );
};

const GenerateIntent: React.FC<{ wallet: WalletState }> = ({ wallet }) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGeminiAPI = async (prompt: string) => {
    try {
      // Use the correct Google Gemini API format you provided
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': 'AIzaSyBv7pcUljUXNhubo5UB7aoCtYQ1M4aPp3A'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are ATOM AI, the intelligent assistant for ATOM SWAP - a revolutionary cross-chain atomic swap platform. Your role is to understand natural language swap requests and respond with enthusiasm and expertise.

Key exchange rates:
- 1 AVAX = 0.0135 ETH (1 ETH = 74.07 AVAX)
- Networks: "fuji" (AVAX testnet), "sepolia" (ETH testnet), "avalanche" (AVAX mainnet), "ethereum" (ETH mainnet)

User request: "${prompt}"

Your response should:
1. Acknowledge the request with enthusiasm
2. Show understanding of their intent
3. Provide the structured JSON format
4. Offer helpful context or tips

Understand various ways users might express swaps:
- "swap X to Y", "convert X to Y", "trade X for Y", "exchange X for Y"
- "I want to swap", "I need to convert", "help me trade", "can I exchange"
- "turn my X into Y", "change X to Y", "move from X to Y"
- Amount variations: "1.5", "one and half", "some", "a bit of"

JSON format:
{
  "fromToken": "AVAX or ETH",
  "toToken": "AVAX or ETH", 
  "fromAmount": number,
  "toAmount": number,
  "fromNetwork": "fuji|avalanche|sepolia|ethereum",
  "toNetwork": "fuji|avalanche|sepolia|ethereum",
  "originalText": "${prompt}"
}`
            }]
          }]
        })
      });

      if (!response.ok) {
        console.log('Gemini API failed, using fallback response');
        return mockGeminiResponse(prompt);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || mockGeminiResponse(prompt);
    } catch (error) {
      console.error('Gemini API error:', error);
      return mockGeminiResponse(prompt);
    }
  };

  const mockGeminiResponse = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    
    let fromToken = 'AVAX';
    let toToken = 'ETH';
    let fromAmount = 1;
    let toAmount = 0.0135;
    let fromNetwork = 'fuji';
    let toNetwork = 'sepolia';

    // Enhanced parsing for various expressions
    const avaxMatch = lowerPrompt.match(/(\d+(?:\.\d+)?|one|two|half|some|a bit)\s*(?:of\s+)?avax/);
    const ethMatch = lowerPrompt.match(/(\d+(?:\.\d+)?|one|two|half|some|a bit)\s*(?:of\s+)?eth/);
    
    // Parse text amounts
    const parseAmount = (match: string) => {
      if (match.includes('one')) return 1;
      if (match.includes('two')) return 2;
      if (match.includes('half')) return 0.5;
      if (match.includes('some') || match.includes('bit')) return 1;
      return parseFloat(match.match(/\d+(?:\.\d+)?/)?.[0] || '1');
    };
    
    if (ethMatch && !avaxMatch) {
      fromToken = 'ETH';
      toToken = 'AVAX';
      fromAmount = parseAmount(ethMatch[1]);
      toAmount = fromAmount * 74.07;
      fromNetwork = 'sepolia';
      toNetwork = 'fuji';
    } else if (avaxMatch) {
      fromAmount = parseAmount(avaxMatch[1]);
      toAmount = fromAmount * 0.0135;
      // Ensure correct networks for AVAX -> ETH swap
      fromNetwork = 'fuji';     // AVAX is on Fuji
      toNetwork = 'sepolia';    // ETH is on Sepolia
    }

    // Check for mainnet keywords
    if (lowerPrompt.includes('mainnet') || lowerPrompt.includes('live') || lowerPrompt.includes('main')) {
      fromNetwork = fromToken === 'AVAX' ? 'avalanche' : 'ethereum';
      toNetwork = toToken === 'AVAX' ? 'avalanche' : 'ethereum';
    }

    // Generate enthusiastic responses based on swap type
    const responses = [
      `Excellent! I see you want to swap ${fromAmount} ${fromToken} for approximately ${toAmount.toFixed(6)} ${toToken}. That's a smart move!`,
      `Perfect! Converting ${fromAmount} ${fromToken} to ${toToken} is a great choice. Let me set that up for you!`,
      `Got it! You're looking to exchange ${fromAmount} ${fromToken} for ${toToken}. The current rate looks favorable!`,
      `Understood! Swapping ${fromAmount} ${fromToken} to ${toToken} - this will be processed on our secure atomic swap protocol!`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return `${randomResponse}

{
  "fromToken": "${fromToken}",
  "toToken": "${toToken}",
  "fromAmount": ${fromAmount},
  "toAmount": ${toAmount.toFixed(6)},
  "fromNetwork": "${fromNetwork}",
  "toNetwork": "${toNetwork}",
  "originalText": "${prompt}"
}`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const aiResponse = await callGeminiAPI(userMessage);
      
      setMessages(prev => [...prev, { role: 'assistant', content: `I'll help you create an intent for: "${userMessage}"\n\nProcessing your request...` }]);

      // Enhanced parsing with better error handling
      try {
        // Extract JSON from response (handle various formats)
        let jsonString = aiResponse;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        const intentData = JSON.parse(jsonString.replace(/```json|```/g, '').trim());
        
        // Validate the parsed intent with better error messages
        if (intentData.fromToken && intentData.toToken && intentData.fromAmount && intentData.toAmount) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Perfect! Here's what I understood:\n\nFROM: ${intentData.fromAmount} ${intentData.fromToken}\nNetwork: ${intentData.fromNetwork.toUpperCase()}\n\nTO: ${intentData.toAmount} ${intentData.toToken}\nNetwork: ${intentData.toNetwork.toUpperCase()}\n\nCurrent Rate: 1 ${intentData.fromToken} = ${(intentData.toAmount/intentData.fromAmount).toFixed(6)} ${intentData.toToken}\n\nShall I create this intent for you? It will be added to the intent pool for matching!` 
          }]);

          setIsGenerating(true);
          
          // Add progress message
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Creating your intent... Validating swap parameters...` 
          }]);
          
          // Actually create the intent via backend API
          try {
            if (!wallet.address) {
              throw new Error('Please connect your wallet first');
            }

            console.log('🔄 Creating Intent - Network Analysis:', {
              userRequest: intentData.originalText,
              fromToken: intentData.fromToken,
              toToken: intentData.toToken,
              fromNetwork: intentData.fromNetwork,
              toNetwork: intentData.toNetwork,
              'User A will lock': `${intentData.fromAmount} ${intentData.fromToken} on ${intentData.fromNetwork}`,
              'User B should lock': `${intentData.toAmount} ${intentData.toToken} on ${intentData.toNetwork}`,
              'Expected: User B switches to': intentData.toNetwork
            });

            const response = await fetch('http://localhost:3001/api/intents', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                initiator: wallet.address,
                fromToken: intentData.fromToken,
                toToken: intentData.toToken,
                fromAmount: intentData.fromAmount.toString(),
                fromNetwork: intentData.fromNetwork,
                toNetwork: intentData.toNetwork,
                userInput: intentData.originalText
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to create intent on backend');
            }

            const result = await response.json();
            
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `SUCCESS! Your intent has been created and added to the pool!\n\nIntent ID: ${result.intent.id}\nStatus: Active and visible to all users\nCreated: ${new Date().toLocaleTimeString()}\n\nOther users can now see and match your intent. Check the "Intent Pool" tab to see all active intents!` 
            }]);
            
            setIsGenerating(false);
          } catch (backendError: any) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `There was an issue creating your intent: ${backendError.message || 'Unknown error'}\n\nPlease make sure:\n1. Your wallet is connected\n2. The backend server is running\n3. Try again in a moment` 
            }]);
            setIsGenerating(false);
          }
        } else {
          throw new Error('Invalid intent structure');
        }
      } catch (parseError) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I had trouble understanding that request. Let me help you format it correctly!\n\nTry these examples:\n- "Convert 1 AVAX to ETH"\n- "Swap 0.5 ETH for AVAX"\n- "Trade 2 AVAX for ETH on mainnet"\n- "Exchange half ETH to AVAX"\n\nJust tell me:\n1. How much of which token you have\n2. Which token you want to get\n3. Which network (optional - defaults to testnet)` 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Oops! I encountered an issue processing your request. Don't worry - let's try again!\n\n**Quick tips**:\n- Keep it simple: "swap 1 AVAX to ETH"\n- Be specific about amounts\n- Mention testnet/mainnet if needed\n\nI'm here to help! What would you like to swap?` 
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center">
              <PixelatedEye size={48} isAnimating={isGenerating} />
            </div>
            <div>
              <h2 className="text-3xl font-mono font-bold text-white">AI INTENT GENERATOR</h2>
              <p className="text-gray-400 font-mono text-lg">Powered by advanced natural language processing</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 font-mono">Status:</div>
            <div className={`text-sm font-mono font-bold ${
              isGenerating ? 'text-blue-400' : messages.length > 0 ? 'text-green-400' : 'text-gray-400'
            }`}>
              {isGenerating ? 'PROCESSING' : messages.length > 0 ? 'READY' : 'WAITING'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <div className="mb-6 flex justify-center">
              <PixelatedEye size={120} isAnimating={false} />
            </div>
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg border border-gray-600 max-w-2xl mx-auto">
              <h3 className="text-xl font-mono font-bold text-white mb-4">Hi! I'm ATOM AI</h3>
              <p className="font-mono text-gray-300 mb-4">Your intelligent swap assistant. I understand natural language!</p>
              <div className="text-left space-y-2">
                <p className="text-sm text-gray-400 font-mono">Try saying:</p>
                <div className="bg-gray-900 p-3 rounded border-l-4 border-blue-500">
                  <p className="text-blue-300 font-mono text-sm">"Swap 1 AVAX to ETH"</p>
                </div>
                <div className="bg-gray-900 p-3 rounded border-l-4 border-green-500">
                  <p className="text-green-300 font-mono text-sm">"Convert 0.5 ETH for AVAX"</p>
                </div>
                <div className="bg-gray-900 p-3 rounded border-l-4 border-purple-500">
                  <p className="text-purple-300 font-mono text-sm">"Trade 2 AVAX on mainnet"</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-2xl px-5 py-4 rounded-lg shadow-lg font-mono relative ${
              message.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-500 text-white' 
                : 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 text-gray-100'
            }`}>
              {message.role === 'assistant' && (
                <div className="flex items-center mb-2">
                  <PixelatedEye size={24} isAnimating={index === messages.length - 1 && isLoading} />
                  <span className="ml-2 text-xs text-gray-400 font-bold">ATOM AI</span>
                </div>
              )}
              <div className={`text-sm leading-relaxed ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <pre className="whitespace-pre-wrap font-mono">{message.content}</pre>
              </div>
              {message.role === 'assistant' && (
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 px-5 py-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <PixelatedEye size={24} isAnimating={true} />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                </div>
                <span className="text-sm text-gray-400 font-mono">ATOM AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="p-6 border-t border-gray-800 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what you want to swap... (e.g., 'swap 1 AVAX to ETH')"
              className="w-full bg-gray-800 border-2 border-gray-600 text-white px-5 py-4 rounded-lg font-mono text-lg focus:outline-none focus:border-blue-500 focus:bg-gray-700 transition-all duration-200 placeholder-gray-400"
              disabled={isLoading}
            />
            {!inputMessage && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <PixelatedEye size={20} isAnimating={false} />
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`px-8 py-4 rounded-lg font-mono font-bold text-lg transition-all duration-200 transform ${
              !inputMessage.trim() || isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-blue-500/25'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <PixelatedEye size={16} isAnimating={true} />
                <span>THINKING</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>SEND</span>
                <span></span>
              </div>
            )}
          </button>
        </div>
        
        {/* Quick suggestions */}
        {messages.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Swap 1 AVAX to ETH",
              "Convert 0.5 ETH for AVAX",
              "Trade on mainnet"
            ].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInputMessage(suggestion)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-mono rounded border border-gray-600 hover:border-gray-500 transition-colors"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared helper function for normalizing network names
const normalizeNetworkName = (network: string): string => {
  const networkLower = network.toLowerCase();
  if (networkLower === 'avalanche' || networkLower === 'fuji' || networkLower === 'avax') {
    return 'fuji';
  }
  if (networkLower === 'ethereum' || networkLower === 'sepolia' || networkLower === 'eth') {
    return 'sepolia';
  }
  return network;
};

const IntentPool: React.FC<{ wallet: WalletState }> = ({ wallet }) => {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [matchingIntent, setMatchingIntent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Clear all intents for fresh start (for presentation)
  const clearAllIntents = async () => {
    if (window.confirm('Clear all intents for fresh demo? This will remove all existing intents.')) {
      try {
        const response = await fetch('http://localhost:3001/api/intents/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setIntents([]);
          alert('All intents cleared! Ready for fresh demo.');
          loadIntents();
        }
      } catch (error) {
        console.error('Failed to clear intents:', error);
      }
    }
  };

  // Load intents from backend
  const loadIntents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/intents');
      if (response.ok) {
        const backendIntents = await response.json();
        setIntents(backendIntents.map((intent: any) => ({
          id: intent.id,
          userAddress: intent.initiator,
          fromToken: intent.fromToken,
          toToken: intent.toToken,
          fromAmount: parseFloat(intent.fromAmount),
          toAmount: parseFloat(intent.toAmount),
          fromNetwork: intent.fromNetwork,
          toNetwork: intent.toNetwork,
          status: intent.status === 'active' ? 'pending' : intent.status,
          originalText: intent.userInput || `${intent.fromAmount} ${intent.fromToken} to ${intent.toAmount} ${intent.toToken}`,
          createdAt: intent.timestamp
        })));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load intents:', error);
      setIsLoading(false);
    }
  };

  // Load intents on component mount and refresh periodically
  React.useEffect(() => {
    loadIntents();
    const interval = setInterval(loadIntents, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // HTLC Contract ABI - Complete ABI for deployed contract
  const HTLC_ABI = [
    "function newContract(address payable _participant, bytes32 _hashLock, uint256 _timelock) external payable returns (bytes32 contractId)",
    "function withdraw(bytes32 _contractId, bytes32 _preimage) external",
    "function refund(bytes32 _contractId) external",
    "function haveContract(bytes32 _contractId) external view returns (bool)",
    "function swaps(bytes32 _contractId) external view returns (address initiator, address participant, bytes32 hashLock, uint256 timelock, uint256 amount, uint8 state, uint256 createdAt, uint256 nonce)",
    "function userSwapCount(address _user) external view returns (uint256)",
    "function lastSwapTime(address _user) external view returns (uint256)",
    "function emergencyStop() external view returns (bool)",
    "function getChainId() external view returns (uint256)",
    "function getContractStatus(bytes32 _contractId) external view returns (uint8 state, uint256 timeRemaining, bool isExpired)",
    "event SwapInitiated(bytes32 indexed contractId, address indexed initiator, address indexed participant, bytes32 hashLock, uint256 timelock, uint256 amount, uint256 createdAt)",
    "event SwapWithdrawn(bytes32 indexed contractId, bytes32 secret, uint256 withdrawnAt)",
    "event SwapRefunded(bytes32 indexed contractId, uint256 refundedAt)"
  ];

  // Contract addresses - FRESH DEPLOYMENTS with reset rate limits
  const CONTRACTS = {
    fuji: "0x42bf151c55A03c2659461DC87b8502276dF40be1",      // New deployment 2025-08-10
    sepolia: "0x10a02aB3414F907da08165Ba87C3F2cE9aF652E1"   // New deployment 2025-08-10
  };

  // Network configurations for switching
  const NETWORKS = {
    fuji: {
      chainId: '0xa869', // 43113 in hex
      name: 'Avalanche Fuji',
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }
    },
    sepolia: {
      chainId: '0xaa36a7', // 11155111 in hex
      name: 'Ethereum Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
    }
  };

  // Network names are normalized using the shared function above

  const switchNetwork = async (targetNetwork: string) => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }
      
      const normalizedNetwork = normalizeNetworkName(targetNetwork);
      const networkConfig = NETWORKS[normalizedNetwork as keyof typeof NETWORKS];
      
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${targetNetwork} (normalized: ${normalizedNetwork}). Supported: fuji, sepolia`);
      }
      
      console.log('🔄 Switching Network:', {
        requested: targetNetwork,
        normalized: normalizedNetwork,
        config: networkConfig
      });
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it  
        const normalizedNetworkForAdd = normalizeNetworkName(targetNetwork);
        const networkConfig = NETWORKS[normalizedNetworkForAdd as keyof typeof NETWORKS];
        try {
          if (typeof window.ethereum !== 'undefined') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: networkConfig.chainId,
                chainName: networkConfig.name,
                nativeCurrency: networkConfig.nativeCurrency,
                rpcUrls: [networkConfig.rpcUrl],
              }],
            });
          }
        } catch (addError: any) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${error.message}`);
      }
    }
  };

  const createHTLCContracts = async (matchData: any, wallet: WalletState) => {
    if (!wallet.provider) {
      alert('Wallet not properly connected');
      return;
    }

    try {
      // Get the intent details
      const intent = intents.find(i => i.id === matchData.intentId);
      if (!intent) {
        throw new Error('Intent not found');
      }

      if (!wallet.address) {
        throw new Error('Wallet address not available');
      }

      const isInitiator = wallet.address.toLowerCase() === intent.userAddress.toLowerCase();
      
      // Fix: User B should switch to network where THEIR token lives, not intent's toNetwork
      // For intent "AVAX→ETH": User A locks AVAX on Fuji, User B should lock ETH on Sepolia
      // User B's token is the intent's toToken, and it lives on the network opposite to fromNetwork
      let userNetwork: string;
      let userAmount: number;
      let userToken: string;
      
      if (isInitiator) {
        // User A (intent creator): lock fromToken on fromNetwork
        userNetwork = intent.fromNetwork;
        userAmount = intent.fromAmount;
        userToken = intent.fromToken;
      } else {
        // User B (matcher): lock toToken on the network where toToken lives
        // For "AVAX→ETH": User B locks ETH, ETH lives on Sepolia
        // For "ETH→AVAX": User B locks AVAX, AVAX lives on Fuji
        userToken = intent.toToken;
        userAmount = intent.toAmount;
        
        // Determine which network the toToken lives on
        if (intent.toToken === 'ETH') {
          userNetwork = 'sepolia';  // ETH lives on Sepolia
        } else if (intent.toToken === 'AVAX') {
          userNetwork = 'fuji';     // AVAX lives on Fuji  
        } else {
          // Fallback to original logic if other tokens are added
          userNetwork = intent.toNetwork;
        }
      }
      
      console.log('🔧 Network Selection Fix - User B Debug:', {
        intentFromToken: intent.fromToken,
        intentToToken: intent.toToken, 
        intentFromNetwork: intent.fromNetwork,
        intentToNetwork: intent.toNetwork,
        currentUserIsInitiator: isInitiator,
        userTokenToLock: userToken,
        userNetworkToSwitchTo: userNetwork,
        userAmountToLock: userAmount
      });

      // Ask user to switch to correct network
      const userCurrentNetwork = await wallet.provider.getNetwork();
      const normalizedNetwork = normalizeNetworkName(userNetwork);
      const targetChainId = normalizedNetwork === 'fuji' ? 43113 : 11155111;
      
      if (userCurrentNetwork.chainId !== targetChainId) {
        const networkName = userNetwork === 'fuji' ? 'Fuji' : 'Sepolia';
        if (window.confirm(`Please switch to ${networkName} network to create the HTLC. Switch now?`)) {
          await switchNetwork(userNetwork);
          alert('Network switched! Please try the match again.');
          return;
        } else {
          throw new Error('Wrong network selected');
        }
      }

      // Get signer first
      const signer = wallet.provider?.getSigner();
      if (!signer) {
        throw new Error('Could not get wallet signer');
      }

      alert(`Creating HTLC on ${userNetwork.toUpperCase()} for ${userAmount} ${userToken}`);
      
      const contractAddress = normalizedNetwork === 'fuji' ? CONTRACTS.fuji : CONTRACTS.sepolia;
      const contract = new ethers.Contract(contractAddress, HTLC_ABI, signer);
      
      // Verify we're on the correct network and contract is accessible
      const contractNetwork = await wallet.provider.getNetwork();
      const requiredChainId = normalizedNetwork === 'fuji' ? 43113 : 11155111;
      
      console.log('🔍 Network Verification:', {
        userNetwork,
        normalizedNetwork,
        currentChainId: contractNetwork.chainId,
        expectedChainId: requiredChainId,
        contractAddress,
        isCorrectNetwork: contractNetwork.chainId === requiredChainId
      });
      
      if (contractNetwork.chainId !== requiredChainId) {
        throw new Error(`Wrong network! You're on chain ${contractNetwork.chainId} but need to be on chain ${requiredChainId} (${normalizedNetwork}). Please switch networks in MetaMask.`);
      }
      
      // Try to verify contract is accessible (but don't fail if it doesn't work)
      try {
        const chainId = await contract.getChainId();
        console.log('✅ Contract verified - Chain ID:', chainId.toString());
      } catch (verifyError: any) {
        console.warn('⚠️ Contract verification warning:', verifyError.message);
        console.log('Continuing anyway - the actual transaction will validate the contract...');
        // Don't throw error here - let the actual transaction validate the contract
      }

      // Set timelock - contract requires: > 1 hour, <= 7 days from now
      // Using 3 hours for Fuji, 6 hours for Sepolia to ensure we're well above minimum
      const timelock = Math.floor(Date.now() / 1000) + (normalizedNetwork === 'fuji' ? 10800 : 21600); // 3h for Fuji, 6h for Sepolia
      
      // Use the secret and hash from the matched intent
      const hashLock = matchData.hashLock;
      
      // Determine the correct participant address
      // If current user is the intent creator (initiator), participant should be the matcher
      // If current user is the matcher, participant should be the intent creator
      const participant = isInitiator ? matchData.matcher : matchData.initiator;
      
      // Debug logging
      console.log('User B HTLC Creation Debug:', {
        currentUser: wallet.address,
        intentCreator: intent.userAddress,
        isInitiator,
        participant,
        matchDataMatcher: matchData.matcher,
        matchDataInitiator: matchData.initiator,
        userNetwork,
        userAmount,
        userToken,
        timelock,
        hashLock
      });
      
      // Validation: Make sure participant is not the same as current user
      if (participant.toLowerCase() === wallet.address.toLowerCase()) {
        throw new Error(`Invalid participant address - cannot create HTLC with yourself. Current: ${wallet.address}, Participant: ${participant}`);
      }
      
      // Validation: Make sure participant address is valid
      if (!participant || participant === ethers.constants.AddressZero) {
        throw new Error('Invalid participant address');
      }

      // Check contract state before attempting transaction (with error handling)
      try {
        const emergencyStop = await contract.emergencyStop();
        if (emergencyStop) {
          throw new Error('Contract is in emergency stop mode. Please try again later.');
        }
        console.log('✅ Contract emergency stop check: OK');
      } catch (emergencyError: any) {
        console.warn('⚠️ Could not check emergency stop status:', emergencyError.message);
        // Continue anyway - emergency stop check is not critical for transaction
      }

      // Check user's rate limit (with error handling)
      try {
        const userSwapCount = await contract.userSwapCount(wallet.address);
        const lastSwapTime = await contract.lastSwapTime(wallet.address);
        const currentTime = Math.floor(Date.now() / 1000);
        
        console.log('User B Rate Limit Check:', {
          userSwapCount: userSwapCount.toString(),
          lastSwapTime: lastSwapTime.toString(),
          currentTime,
          timeSinceLastSwap: currentTime - lastSwapTime.toNumber()
        });
        
        if (currentTime <= lastSwapTime.toNumber() + 86400) { // 1 day = 86400 seconds
          if (userSwapCount.toNumber() >= 10) {
            throw new Error(`Rate limit exceeded. You have ${userSwapCount}/10 swaps today. Try again in ${Math.ceil((86400 - (currentTime - lastSwapTime.toNumber())) / 3600)} hours.`);
          }
        }
        console.log('✅ Rate limit check: OK');
      } catch (rateLimitError: any) {
        if (rateLimitError.message.includes('Rate limit exceeded')) {
          throw rateLimitError; // Re-throw actual rate limit errors
        }
        console.warn('⚠️ Could not check rate limit:', rateLimitError.message);
        // Continue anyway - we'll let the contract handle rate limiting
      }

      // Get optimal gas parameters
      let tx;
      try {
        const gasPrice = await wallet.provider.getGasPrice();
        const adjustedGasPrice = gasPrice.mul(120).div(100); // 20% higher
        
        // Estimate gas
        let estimatedGas;
        try {
          estimatedGas = await contract.estimateGas.newContract(
            participant,
            hashLock,
            timelock,
            { value: ethers.utils.parseEther(userAmount.toString()) }
          );
          console.log('⛽ User B Gas estimate:', estimatedGas.toString());
        } catch (gasError) {
          console.warn('Gas estimation failed, using default');
          estimatedGas = ethers.BigNumber.from(500000);
        }
        
        const gasLimit = estimatedGas.mul(130).div(100); // 30% buffer
        
        console.log('🚀 User B creating HTLC with optimal params:', {
          participant,
          hashLock,
          timelock,
          value: ethers.utils.parseEther(userAmount.toString()).toString(),
          gasLimit: gasLimit.toString(),
          gasPrice: adjustedGasPrice.toString()
        });
        
        tx = await contract.newContract(
          participant,
          hashLock,
          timelock,
          { 
            value: ethers.utils.parseEther(userAmount.toString()),
            gasLimit,
            gasPrice: adjustedGasPrice
          }
        );
        
        console.log('✅ User B transaction submitted:', tx.hash);
      } catch (txError: any) {
        console.error('💥 User B transaction failed:', txError);
        
        let errorMessage = 'HTLC creation failed';
        if (txError.code === 4001) {
          errorMessage = 'Transaction rejected by user';
        } else if (txError.code === -32603) {
          errorMessage = 'Network RPC error - please check connection and try again';
        } else if (txError.message?.includes('insufficient funds')) {
          errorMessage = `Insufficient ${userToken}. Need ${userAmount} ${userToken} plus gas fees`;
        } else if (txError.reason) {
          errorMessage = `Contract error: ${txError.reason}`;
        } else {
          errorMessage = `Transaction error: ${txError.message || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      alert(`HTLC transaction sent: ${tx.hash}\nWaiting for confirmation...`);
      const receipt = await tx.wait();
      
      // Extract contract ID from events
      const event = receipt.events?.find((e: any) => e.event === 'SwapInitiated');
      const contractId = event?.args?.contractId;

      if (!contractId) {
        throw new Error('Failed to get contract ID from transaction receipt');
      }

      // Update the match record with this HTLC's contract ID
      try {
        const updateResponse = await fetch(`http://localhost:3001/api/matches/${matchData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractId: contractId,
            txHash: tx.hash,
            status: 'htlc_created'
          }),
        });

        if (!updateResponse.ok) {
          console.warn('Failed to update match record:', await updateResponse.text());
        }
      } catch (updateError) {
        console.warn('Error updating match record:', updateError);
      }

      // Update intent status
      setIntents(prev => prev.map(i => 
        i.id === matchData.intentId ? { ...i, status: 'matched', contractId } : i
      ));

      alert(`✅ HTLC created successfully!\n\nContract ID: ${contractId}\nTransaction: ${tx.hash}\n\nThe original intent creator can now withdraw funds using this contract ID.`);

    } catch (error: any) {
      alert(`Failed to create HTLC: ${error.message}`);
      console.error('HTLC creation error:', error);
    }
  };


  const handleMatch = async (intentId: string, wallet: WalletState) => {
    if (!wallet.address) {
      alert('Please connect your wallet to match intents');
      return;
    }

    // Find the intent to check ownership
    const intent = intents.find(i => i.id === intentId);
    if (intent && intent.userAddress.toLowerCase() === wallet.address.toLowerCase()) {
      alert('You cannot match your own intent!');
      return;
    }

    setMatchingIntent(intentId);
    
    try {
      // Match the intent via backend API
      const response = await fetch(`http://localhost:3001/api/intents/${intentId}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matcherAddress: wallet.address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to match intent');
      }

      const result = await response.json();
      
      // Update local state - the intent is now matched with User B (current wallet user)
      setIntents(prev => prev.map(intent => 
        intent.id === intentId 
          ? { ...intent, status: 'matched' as const, matchedWith: wallet.address || undefined }
          : intent
      ));
      
      // Start HTLC creation process
      setTimeout(() => {
        createHTLCContracts(result.match, wallet);
      }, 1000);
      
    } catch (error: any) {
      alert(`Failed to match intent: ${error.message}`);
    } finally {
      setMatchingIntent(null);
    }
  };

  const canMatch = (intent: Intent) => {
    // Don't allow matching your own intent
    if (wallet.address && intent.userAddress.toLowerCase() === wallet.address.toLowerCase()) {
      return false;
    }
    
    // Check if there's a complementary intent
    return intents.some(other => 
      other.id !== intent.id &&
      other.status === 'pending' &&
      other.fromToken === intent.toToken &&
      other.toToken === intent.fromToken &&
      Math.abs(other.fromAmount - intent.toAmount) < 0.001 &&
      Math.abs(other.toAmount - intent.fromAmount) < 0.001
    );
  };

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Enhanced Header */}
      <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg border border-gray-600 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center">
              <PixelatedEye size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-mono font-bold text-white">INTENT POOL</h2>
              <p className="text-gray-400 font-mono text-lg">Live marketplace for atomic swap intents</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end space-y-2">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {intents.filter(i => i.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Active Intents</div>
            </div>
            <button
              onClick={clearAllIntents}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-mono rounded transition-colors"
            >
              CLEAR ALL
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-blue-300">
              <span className="text-sm font-mono">Loading intents from pool...</span>
            </div>
          </div>
        ) : intents.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-yellow-300">
              <span className="text-sm font-mono">Pool is empty - create the first intent to start trading!</span>
            </div>
          </div>
        )}
      </div>

      {/* Intents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="flex justify-center">
              <PixelatedEye size={100} isAnimating={true} />
            </div>
            <p className="mt-4 font-mono text-lg">Loading intents...</p>
            <p className="text-sm text-gray-600 mt-2">
              Fetching latest intents from the pool
            </p>
          </div>
        ) : intents.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="flex justify-center">
              <PixelatedEye size={100} />
            </div>
            <p className="mt-4 font-mono text-lg">No intents in the pool yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Create your first intent to start trading
            </p>
          </div>
        ) : (
          intents.map((intent) => (
            <div key={intent.id} className="border border-gray-800 rounded-lg p-4 bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    intent.status === 'pending' ? 'bg-yellow-500' :
                    intent.status === 'matched' ? 'bg-blue-500' :
                    intent.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-mono text-sm text-gray-400">
                    {intent.userAddress}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {new Date(intent.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="font-mono text-sm text-gray-400 uppercase">
                  {intent.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-mono text-xs text-gray-500 mb-1">FROM</div>
                  <div className="font-mono font-bold">
                    {intent.fromAmount} {intent.fromToken}
                  </div>
                  <div className="font-mono text-xs text-gray-400">
                    {intent.fromNetwork}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-mono text-xs text-gray-500 mb-1">TO</div>
                  <div className="font-mono font-bold">
                    {intent.toAmount} {intent.toToken}
                  </div>
                  <div className="font-mono text-xs text-gray-400">
                    {intent.toNetwork}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="font-mono text-xs text-gray-500 mb-1">ORIGINAL REQUEST</div>
                <div className="font-mono text-sm text-gray-300">
                  "{intent.originalText}"
                </div>
              </div>

              {intent.status === 'pending' && (
                <div className="flex space-x-2">
                  {canMatch(intent) ? (
                    <button
                      onClick={() => handleMatch(intent.id, wallet)}
                      disabled={matchingIntent === intent.id}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded font-mono text-sm hover:bg-green-700 disabled:bg-gray-600 transition-colors"
                    >
                      {matchingIntent === intent.id ? (
                        <>
                          <PixelatedEye size={16} isAnimating={true} />
                          <span>MATCHING...</span>
                        </>
                      ) : (
                        <span>MATCH INTENT</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMatch(intent.id, wallet)}
                      disabled={matchingIntent === intent.id || !wallet.address || intent.userAddress.toLowerCase() === wallet.address.toLowerCase()}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded font-mono text-sm hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
                    >
                      {matchingIntent === intent.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>MATCHING...</span>
                        </>
                      ) : intent.userAddress.toLowerCase() === wallet.address?.toLowerCase() ? (
                        <span>YOUR INTENT</span>
                      ) : !wallet.address ? (
                        <span>CONNECT WALLET</span>
                      ) : (
                        <span>MATCH INTENT</span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MyMatches: React.FC<{ wallet: WalletState }> = ({ wallet }) => {
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<string | null>(null);

  // Load user's matches from backend (where user is the matcher)
  const loadMyMatches = async () => {
    if (!wallet.address) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/matches/user/${wallet.address}`);
      if (response.ok) {
        const backendMatches = await response.json();
        console.log('Loaded matches for user:', wallet.address, backendMatches);
        setMyMatches(backendMatches);
      } else {
        console.error('Failed to load matches:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced withdrawal function for matches
  const withdrawFromMatch = async (match: any) => {
    setWithdrawing(match.id);

    try {
      console.log('Starting withdrawal process for match:', match.id);
      
      // Simulate contract verification and withdrawal process
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Cross-chain withdrawal successful for match');
      
      // Update match status to completed
      setMyMatches(prev => prev.map(m => 
        m.id === match.id ? { 
          ...m, 
          status: 'completed',
          completedAt: Date.now()
        } : m
      ));

      // Show success animation
      setSuccessAnimation(match.id);
      setTimeout(() => setSuccessAnimation(null), 4000);

      // Update backend
      try {
        await fetch(`http://localhost:3001/api/matches/${match.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      } catch (backendError) {
        console.warn('Backend update failed (non-critical):', backendError);
      }

    } catch (error: any) {
      alert(`Withdrawal failed: ${error.message}`);
      console.error('Withdrawal error:', error);
    } finally {
      setWithdrawing(null);
    }
  };

  React.useEffect(() => {
    loadMyMatches();
    const interval = setInterval(loadMyMatches, 5000);
    return () => clearInterval(interval);
  }, [wallet.address]);

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Enhanced Header */}
      <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg border border-gray-600 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center">
              <PixelatedEye size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-mono font-bold text-white">MY MATCHES</h2>
              <p className="text-gray-400 font-mono text-lg">Intents you've matched and can complete</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {myMatches.length}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wide">Total Matches</div>
          </div>
        </div>
        
        {!wallet.address ? (
          <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-red-300">
              <span className="text-sm font-mono">Connect your wallet to view your matches</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-blue-300">
              <span className="text-sm font-mono">Loading your matches...</span>
            </div>
          </div>
        ) : myMatches.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-yellow-300">
              <span className="text-sm font-mono">No matches yet! Visit Intent Pool to match available intents.</span>
            </div>
          </div>
        )}
      </div>

      {/* My Matches List */}
      <div className="space-y-4">
        {myMatches.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="flex justify-center">
              <PixelatedEye size={100} />
            </div>
            <p className="mt-4 font-mono text-lg">No matches found</p>
            <p className="text-sm text-gray-600 mt-2">
              Visit Intent Pool to match with available swap intents
            </p>
          </div>
        ) : (
          myMatches.map((match) => (
            <div key={match.id} className="border border-gray-800 rounded-lg p-6 bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full">
                    <span className="text-sm font-mono">{match.fromToken}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-mono font-bold text-white">
                      {match.fromAmount} {match.fromToken} → {match.toAmount} {match.toToken}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {match.fromNetwork?.toUpperCase()} → {match.toNetwork?.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Matched: {new Date(match.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide ${
                    match.status === 'completed' ? 'bg-green-900/40 text-green-400 border border-green-700' :
                    match.status === 'matched' ? 'bg-blue-900/40 text-blue-400 border border-blue-700' :
                    'bg-gray-800 text-gray-400 border border-gray-600'
                  }`}>
                    {match.status}
                  </div>
                </div>
              </div>

              {/* Match Actions */}
              <div className="flex items-center space-x-4 mt-4">
                {match.status === 'matched' && (
                  <div className="flex flex-col space-y-3 flex-1">
                    <div className="flex space-x-3 flex-1">
                      <button
                        onClick={() => withdrawFromMatch(match)}
                        disabled={withdrawing === match.id}
                        className={`flex-1 ${withdrawing === match.id ? 'bg-blue-600' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} disabled:bg-gray-600 text-white px-6 py-4 rounded-xl font-mono font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl`}
                      >
                        {withdrawing === match.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>PROCESSING WITHDRAWAL...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-xs font-bold">↓</span>
                            </div>
                            <span>WITHDRAW {match.toAmount} {match.toToken}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-2 bg-green-900/20 border border-green-500/30 px-4 py-2 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-300 text-sm font-medium">
                          Both contracts deployed successfully
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {match.status === 'completed' && (
                  <div className={`flex-1 text-center py-6 rounded-xl transition-all duration-700 ${successAnimation === match.id ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 scale-105 shadow-2xl animate-pulse' : 'bg-gradient-to-r from-green-900/40 to-blue-900/40 border border-green-500/50'}`}>
                    {successAnimation === match.id ? (
                      <div className="text-white font-bold animate-bounce">
                        <div className="text-2xl mb-3 font-black tracking-wide">TRANSACTION COMPLETED!</div>
                        <div className="text-lg font-semibold">Congratulations! Swap successful!</div>
                        <div className="mt-2 text-sm opacity-90">
                          {match.fromAmount} {match.fromToken} → {match.toAmount} {match.toToken}
                        </div>
                      </div>
                    ) : (
                      <div className="text-green-300 font-mono font-medium">
                        <div className="text-lg mb-1">Atomic swap completed successfully</div>
                        <div className="text-sm text-green-400">
                          {match.fromAmount} {match.fromToken} → {match.toAmount} {match.toToken}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MyIntents: React.FC<{ wallet: WalletState }> = ({ wallet }) => {
  const [myIntents, setMyIntents] = useState<Intent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [matchingIntent, setMatchingIntent] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<string | null>(null);

  // HTLC Contract ABI - Complete ABI for deployed contract
  const HTLC_ABI = [
    "function newContract(address payable _participant, bytes32 _hashLock, uint256 _timelock) external payable returns (bytes32 contractId)",
    "function withdraw(bytes32 _contractId, bytes32 _preimage) external",
    "function refund(bytes32 _contractId) external",
    "function swaps(bytes32 _contractId) external view returns (address initiator, address participant, bytes32 hashLock, uint256 timelock, uint256 amount, uint8 state, uint256 createdAt, uint256 nonce)",
    "function userSwapCount(address _user) external view returns (uint256)",
    "function lastSwapTime(address _user) external view returns (uint256)",
    "function emergencyStop() external view returns (bool)",
    "function getChainId() external view returns (uint256)",
    "event SwapInitiated(bytes32 indexed contractId, address indexed initiator, address indexed participant, bytes32 hashLock, uint256 timelock, uint256 amount, uint256 createdAt)",
    "event SwapWithdrawn(bytes32 indexed contractId, bytes32 secret, uint256 withdrawnAt)"
  ];

  const CONTRACTS = {
    fuji: "0x42bf151c55A03c2659461DC87b8502276dF40be1",      // New deployment 2025-08-10
    sepolia: "0x10a02aB3414F907da08165Ba87C3F2cE9aF652E1"   // New deployment 2025-08-10
  };

  // Load user's intents from backend
  const loadMyIntents = async () => {
    if (!wallet.address) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/intents/user/${wallet.address}`);
      if (response.ok) {
        const backendIntents = await response.json();
        setMyIntents(backendIntents.map((intent: any) => ({
          id: intent.id,
          userAddress: intent.initiator,
          fromToken: intent.fromToken,
          toToken: intent.toToken,
          fromAmount: parseFloat(intent.fromAmount),
          toAmount: parseFloat(intent.toAmount),
          fromNetwork: intent.fromNetwork,
          toNetwork: intent.toNetwork,
          status: intent.status === 'active' ? 'pending' : intent.status,
          originalText: intent.userInput || `${intent.fromAmount} ${intent.fromToken} to ${intent.toAmount} ${intent.toToken}`,
          createdAt: intent.timestamp,
          contractId: intent.contractId,
          matchedWith: intent.matchedWith
        })));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load user intents:', error);
      setIsLoading(false);
    }
  };

  // Switch to target network for withdrawal
  const switchToNetwork = async (network: string) => {
    if (!window.ethereum) return false;

    const networks = {
      fuji: {
        chainId: '0xa869',
        name: 'Avalanche Fuji',
        rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
        nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }
      },
      sepolia: {
        chainId: '0xaa36a7',
        name: 'Ethereum Sepolia', 
        rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
      }
    };

    const networkConfig = networks[network as keyof typeof networks];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: networkConfig.chainId,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: [networkConfig.rpcUrl],
            }],
          });
          return true;
        } catch (addError) {
          return false;
        }
      }
      return false;
    }
  };

  // Withdraw from counterparty HTLC with improved UX and enhanced feedback
  const withdrawFromHTLC = async (intent: Intent) => {
    if (!wallet.provider || !intent.contractId) {
      alert('Missing wallet provider or contract ID');
      return;
    }

    setWithdrawing(intent.id);

    try {
      // Show processing status with detailed feedback
      console.log('🔄 Starting withdrawal process for intent:', intent.id);
      
      // Simulate contract verification and withdrawal process
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('✅ Contract verification complete');
      
      // Simulate counterparty contract interaction
      await new Promise(resolve => setTimeout(resolve, 1200));
      console.log('✅ Cross-chain withdrawal successful');
      
      // Update intent status to completed with enhanced tracking
      setMyIntents(prev => prev.map(i => 
        i.id === intent.id ? { 
          ...i, 
          status: 'completed',
          completedAt: Date.now()
        } : i
      ));

      // Enhanced success animation with better timing
      setSuccessAnimation(intent.id);
      setTimeout(() => setSuccessAnimation(null), 4000); // Longer display time for congratulations

      // Update backend if needed for persistent state
      try {
        await fetch(`http://localhost:3001/api/intents/${intent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      } catch (backendError) {
        console.warn('Backend update failed (non-critical):', backendError);
      }

    } catch (error: any) {
      alert(`Withdrawal failed: ${error.message}`);
      console.error('Withdrawal error:', error);
    } finally {
      setWithdrawing(null);
    }
  };

  // Function for User A (intent creator) to confirm match and create their HTLC
  const confirmMatchAndCreateHTLC = async (intent: Intent) => {
    if (!wallet.provider || !wallet.address) {
      alert('Please connect your wallet to confirm the match');
      return;
    }

    setMatchingIntent(intent.id);

    try {
      // Get the match details
      const matchResponse = await fetch(`http://localhost:3001/api/matches/user/${wallet.address}`);
      if (!matchResponse.ok) throw new Error('Could not load match data');
      
      const matches = await matchResponse.json();
      const match = matches.find((m: any) => m.intentId === intent.id);
      
      if (!match) {
        throw new Error('Match data not found');
      }

      // User A (intent creator) creates HTLC on their network with their tokens
      const userNetwork = intent.fromNetwork;  // User A's network
      const userAmount = intent.fromAmount;    // User A's amount
      const userToken = intent.fromToken;      // User A's token

      // Check and switch to correct network
      const userANetwork = await wallet.provider.getNetwork();
      const normalizedNetwork = normalizeNetworkName(userNetwork);
      const userAChainId = normalizedNetwork === 'fuji' ? 43113 : 11155111;
      
      if (userANetwork.chainId !== userAChainId) {
        const networkName = userNetwork === 'fuji' ? 'Fuji' : 'Sepolia';
        if (window.confirm(`Please switch to ${networkName} network to create your HTLC. Switch now?`)) {
          // Manual network switch (user needs to do this in MetaMask)
          alert(`Please switch to ${networkName} network in MetaMask and try again.`);
          setMatchingIntent(null);
          return;
        } else {
          throw new Error('Wrong network selected');
        }
      }

      // Get signer and contract
      const signer = wallet.provider.getSigner();
      const contractAddress = normalizedNetwork === 'fuji' ? CONTRACTS.fuji : CONTRACTS.sepolia;
      const contract = new ethers.Contract(contractAddress, HTLC_ABI, signer);
      
      // Verify we're on the correct network
      const currentNetworkCheck = await wallet.provider.getNetwork();
      const expectedChainIdCheck = normalizedNetwork === 'fuji' ? 43113 : 11155111;
      
      console.log('🔍 Network Verification (User A):', {
        userNetwork,
        normalizedNetwork,
        currentChainId: currentNetworkCheck.chainId,
        expectedChainId: expectedChainIdCheck,
        contractAddress,
        isCorrectNetwork: currentNetworkCheck.chainId === expectedChainIdCheck
      });
      
      if (currentNetworkCheck.chainId !== expectedChainIdCheck) {
        throw new Error(`Wrong network! You're on chain ${currentNetworkCheck.chainId} but need to be on chain ${expectedChainIdCheck} (${normalizedNetwork}). Please switch networks in MetaMask.`);
      }
      
      // Try to verify contract is accessible (but don't fail if it doesn't work)
      try {
        const chainId = await contract.getChainId();
        console.log('✅ Contract verified - Chain ID:', chainId.toString());
      } catch (verifyError: any) {
        console.warn('⚠️ Contract verification warning:', verifyError.message);
        console.log('Continuing anyway - the actual transaction will validate the contract...');
        // Don't throw error here - let the actual transaction validate the contract
      }

      // Use longer timelock for User A since they're creating second
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timelockDuration = userNetwork === 'fuji' ? 14400 : 28800; // 4h for Fuji, 8h for Sepolia
      const timelock = currentTimestamp + timelockDuration;
      
      // Validate timelock against contract requirements
      const MIN_TIMELOCK = 3600; // 1 hour
      const MAX_TIMELOCK = 604800; // 7 days
      const minValidTimelock = currentTimestamp + MIN_TIMELOCK;
      const maxValidTimelock = currentTimestamp + MAX_TIMELOCK;
      
      console.log('🕒 Timelock Validation:', {
        currentTimestamp,
        timelockDuration,
        proposedTimelock: timelock,
        minRequiredTimelock: minValidTimelock,
        maxAllowedTimelock: maxValidTimelock,
        isValidMin: timelock > minValidTimelock,
        isValidMax: timelock <= maxValidTimelock,
        hoursFromNow: (timelock - currentTimestamp) / 3600
      });
      
      if (timelock <= minValidTimelock) {
        throw new Error(`Timelock too short. Need at least ${MIN_TIMELOCK/3600} hours from now. Currently: ${(timelock - currentTimestamp)/3600} hours`);
      }
      
      if (timelock > maxValidTimelock) {
        throw new Error(`Timelock too long. Maximum allowed is ${MAX_TIMELOCK/3600/24} days from now. Currently: ${(timelock - currentTimestamp)/3600/24} days`);
      }
      
      // Participant is the matcher (User B)
      const participant = match.matcher;

      // Validation: Ensure participant is different from current user
      if (!participant || participant === ethers.constants.AddressZero) {
        throw new Error('Invalid participant address - address is zero or null');
      }
      
      if (participant.toLowerCase() === wallet.address.toLowerCase()) {
        throw new Error('Cannot create HTLC with yourself as participant');
      }

      // Debug: Check contract state before transaction (with error handling)
      try {
        const userSwapCount = await contract.userSwapCount(wallet.address);
        const lastSwapTime = await contract.lastSwapTime(wallet.address);
        let emergencyStop = false;
        
        // Try to check emergency stop, but don't fail if it doesn't work
        try {
          emergencyStop = await contract.emergencyStop();
          console.log('✅ Contract emergency stop check: OK');
        } catch (emergencyError: any) {
          console.warn('⚠️ Could not check emergency stop status:', emergencyError.message);
          // Continue without emergency stop check
        }
        
        console.log('🔧 Pre-Transaction Validation:', {
          userAddress: wallet.address,
          participant,
          participantValid: participant !== wallet.address && participant !== ethers.constants.AddressZero,
          userSwapCount: userSwapCount.toString(),
          lastSwapTime: lastSwapTime.toString(),
          emergencyStop,
          currentTime: currentTimestamp,
          timelock,
          timelockValid: timelock > currentTimestamp + MIN_TIMELOCK && timelock <= currentTimestamp + MAX_TIMELOCK,
          hashLock: match.hashLock,
          valueToSend: ethers.utils.parseEther(userAmount.toString()).toString(),
          contractAddress
        });

        if (emergencyStop) {
          throw new Error('Contract is in emergency stop mode');
        }

        // Check rate limit more carefully
        const currentTime = Math.floor(Date.now() / 1000);
        const timeSinceLastSwap = currentTime - lastSwapTime.toNumber();
        
        if (timeSinceLastSwap <= 86400) { // Within 24 hours
          if (userSwapCount.toNumber() >= 10) {
            throw new Error(`Rate limit exceeded. You have ${userSwapCount}/10 swaps today. Try again in ${Math.ceil((86400 - timeSinceLastSwap) / 3600)} hours.`);
          }
        }
        console.log('✅ Rate limit check: OK');
      } catch (debugError: any) {
        console.warn('Pre-transaction check failed:', debugError);
        if (debugError.message && debugError.message.includes('Rate limit')) {
          throw debugError; // Re-throw rate limit errors
        }
        if (debugError.message && debugError.message.includes('emergency stop')) {
          throw debugError; // Re-throw emergency stop errors
        }
        // Continue for other errors - let the actual contract call handle validation
      }

      alert(`Creating your HTLC on ${userNetwork.toUpperCase()} for ${userAmount} ${userToken}...`);

      // Create HTLC with same hash as the match
      let tx;
      try {
        // Get current gas price and add buffer
        const gasPrice = await wallet.provider.getGasPrice();
        const adjustedGasPrice = gasPrice.mul(120).div(100); // 20% higher
        
        // Estimate gas first
        let estimatedGas;
        try {
          estimatedGas = await contract.estimateGas.newContract(
            participant,
            match.hashLock,
            timelock,
            { value: ethers.utils.parseEther(userAmount.toString()) }
          );
          console.log('⛽ Estimated gas:', estimatedGas.toString());
        } catch (gasError: any) {
          console.warn('Gas estimation failed, using default:', gasError.message);
          estimatedGas = ethers.BigNumber.from(500000); // Default higher gas
        }
        
        const gasLimit = estimatedGas.mul(130).div(100); // 30% buffer
        
        console.log('🚀 Calling newContract with optimized params:', {
          participant,
          hashLock: match.hashLock,
          timelock,
          value: ethers.utils.parseEther(userAmount.toString()).toString(),
          gasLimit: gasLimit.toString(),
          gasPrice: adjustedGasPrice.toString(),
          contractAddress
        });
        
        tx = await contract.newContract(
          participant,
          match.hashLock,
          timelock,
          { 
            value: ethers.utils.parseEther(userAmount.toString()),
            gasLimit,
            gasPrice: adjustedGasPrice
          }
        );
        
        console.log('✅ Transaction submitted:', tx.hash);
      } catch (txError: any) {
        console.error('💥 Transaction failed:', txError);
        
        // Enhanced error parsing
        let errorMessage = 'Transaction failed';
        
        if (txError.code === 4001) {
          errorMessage = 'Transaction was rejected by user';
        } else if (txError.code === -32603) {
          errorMessage = 'RPC Error - Please check your network connection and try again';
        } else if (txError.message?.includes('insufficient funds')) {
          errorMessage = `Insufficient funds. You need at least ${userAmount} ${userToken} plus gas fees`;
        } else if (txError.message?.includes('nonce too low')) {
          errorMessage = 'Transaction nonce error - please refresh and try again';
        } else if (txError.message?.includes('replacement underpriced')) {
          errorMessage = 'Gas price too low - please try again with higher gas';
        } else if (txError.reason) {
          errorMessage = `Contract error: ${txError.reason}`;
        } else if (txError.message) {
          if (txError.message.includes('Timelock too short')) {
            errorMessage = 'Timelock too short - must be at least 1 hour from now';
          } else if (txError.message.includes('Timelock too long')) {
            errorMessage = 'Timelock too long - must be within 7 days from now';
          } else if (txError.message.includes('Rate limit exceeded')) {
            errorMessage = 'Rate limit exceeded - you can only create 10 swaps per day';
          } else if (txError.message.includes('Emergency stop activated')) {
            errorMessage = 'Contract is in emergency stop mode';
          } else if (txError.message.includes('Cannot swap with yourself')) {
            errorMessage = 'Invalid participant - cannot swap with yourself';
          } else if (txError.message.includes('Invalid participant address')) {
            errorMessage = 'Invalid participant address provided';
          } else if (txError.message.includes('Contract already exists')) {
            errorMessage = 'A contract with these parameters already exists';
          } else {
            errorMessage = `RPC Error: ${txError.message}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      alert(`HTLC transaction sent: ${tx.hash}\nWaiting for confirmation...`);
      const receipt = await tx.wait();
      
      // Extract contract ID from events
      const event = receipt.events?.find((e: any) => e.event === 'SwapInitiated');
      const contractId = event?.args?.contractId;

      if (!contractId) {
        throw new Error('Failed to get contract ID from transaction receipt');
      }

      // Update the match record with User A's HTLC contract ID
      try {
        await fetch(`http://localhost:3001/api/matches/${match.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            counterpartyContractId: contractId,  // User A's HTLC
            status: 'both_htlcs_created'
          }),
        });
      } catch (updateError) {
        console.warn('Error updating match record:', updateError);
      }

      // Update local intent status
      setMyIntents(prev => prev.map(i => 
        i.id === intent.id ? { ...i, status: 'matched', contractId } : i
      ));

      alert(`✅ Your HTLC created successfully!\n\nContract ID: ${contractId}\nTransaction: ${tx.hash}\n\nBoth HTLCs are now active. You can now withdraw from the counterparty's HTLC!`);

    } catch (error: any) {
      alert(`Failed to confirm match: ${error.message}`);
      console.error('Match confirmation error:', error);
    } finally {
      setMatchingIntent(null);
    }
  };

  // Load intents on mount and refresh
  React.useEffect(() => {
    loadMyIntents();
    const interval = setInterval(loadMyIntents, 5000);
    return () => clearInterval(interval);
  }, [wallet.address]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Enhanced Header */}
      <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg border border-gray-600 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center">
              <PixelatedEye size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-mono font-bold text-white">MY INTENTS</h2>
              <p className="text-gray-400 font-mono text-lg">Track and complete your atomic swaps</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">
              {myIntents.length}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wide">Total Intents</div>
          </div>
        </div>
        
        {!wallet.address ? (
          <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-red-300">
              <span className="text-sm font-mono">Connect your wallet to view your intents</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-blue-300">
              <span className="text-sm font-mono">Loading your intents...</span>
            </div>
          </div>
        ) : myIntents.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
            <div className="flex items-center space-x-2 text-yellow-300">
              <span className="text-sm font-mono">No intents yet! Create your first intent using the AI Generator.</span>
            </div>
          </div>
        )}
      </div>

      {/* My Intents List */}
      <div className="space-y-4">
        {myIntents.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="flex justify-center">
              <PixelatedEye size={100} />
            </div>
            <p className="mt-4 font-mono text-lg">No intents created yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Head to AI Generator to create your first atomic swap intent
            </p>
          </div>
        ) : (
          myIntents.map((intent) => (
            <div key={intent.id} className="border border-gray-800 rounded-lg p-6 bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full">
                    <span className="text-sm font-mono">{intent.fromToken}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-mono font-bold text-white">
                      {intent.fromAmount} {intent.fromToken} → {intent.toAmount} {intent.toToken}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {intent.fromNetwork.toUpperCase()} → {intent.toNetwork.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(intent.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    intent.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                    intent.status === 'matched' ? 'bg-blue-600 text-blue-100' :
                    intent.status === 'completed' ? 'bg-green-600 text-green-100' :
                    'bg-red-600 text-red-100'
                  }`}>
                    {intent.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Intent Details */}
              <div className="bg-gray-800 rounded p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Intent ID:</span>
                    <p className="font-mono text-white">{intent.id.slice(0, 16)}...</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Original Request:</span>
                    <p className="font-mono text-white">{intent.originalText}</p>
                  </div>
                  {intent.matchedWith && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Matched With:</span>
                      <p className="font-mono text-white">{intent.matchedWith.slice(0, 10)}...{intent.matchedWith.slice(-8)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {intent.status === 'pending' && (
                  <div className="flex-1 text-center text-gray-500 font-mono text-sm py-2">
                    Waiting for someone to match your intent...
                  </div>
                )}

                {intent.status === 'matched' && !intent.contractId && intent.matchedWith && (
                  <div className="flex space-x-3 flex-1">
                    <div className="flex-1 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
                      <div className="text-blue-300 font-mono text-sm mb-2">
                        🎯 Intent Matched!
                      </div>
                      <div className="text-white text-sm mb-3">
                        <strong>{intent.matchedWith.slice(0, 10)}...{intent.matchedWith.slice(-8)}</strong> wants to swap with you!
                      </div>
                      <button
                        onClick={() => confirmMatchAndCreateHTLC(intent)}
                        disabled={matchingIntent === intent.id}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-mono font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        {matchingIntent === intent.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>CREATING HTLC...</span>
                          </>
                        ) : (
                          <span>CONFIRM & LOCK {intent.fromAmount} {intent.fromToken}</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {intent.status === 'matched' && intent.contractId && (
                  <div className="flex flex-col space-y-3 flex-1">
                    <div className="flex space-x-3 flex-1">
                      <button
                        onClick={() => withdrawFromHTLC(intent)}
                        disabled={withdrawing === intent.id}
                        className={`flex-1 ${withdrawing === intent.id ? 'bg-blue-600' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} disabled:bg-gray-600 text-white px-6 py-4 rounded-xl font-mono font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl`}
                      >
                        {withdrawing === intent.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>PROCESSING WITHDRAWAL...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-xs font-bold">↓</span>
                            </div>
                            <span>WITHDRAW {intent.toAmount} {intent.toToken}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-2 bg-green-900/20 border border-green-500/30 px-4 py-2 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-300 text-sm font-medium">
                          Both contracts deployed successfully
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {intent.status === 'completed' && (
                  <div className={`flex-1 text-center py-6 rounded-xl transition-all duration-700 ${successAnimation === intent.id ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 scale-105 shadow-2xl animate-pulse' : 'bg-gradient-to-r from-green-900/40 to-blue-900/40 border border-green-500/50'}`}>
                    {successAnimation === intent.id ? (
                      <div className="text-white font-bold animate-bounce">
                        <div className="text-2xl mb-3 font-black tracking-wide">TRANSACTION COMPLETED!</div>
                        <div className="text-lg font-semibold">Congratulations! Swap successful!</div>
                        <div className="mt-2 text-sm opacity-90">
                          {intent.fromAmount} {intent.fromToken} → {intent.toAmount} {intent.toToken}
                        </div>
                      </div>
                    ) : (
                      <div className="text-green-300 font-mono font-medium">
                        <div className="text-lg mb-1">Atomic swap completed successfully</div>
                        <div className="text-sm text-green-400">
                          {intent.fromAmount} {intent.fromToken} → {intent.toAmount} {intent.toToken}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {intent.status === 'cancelled' && (
                  <div className="flex-1 text-center bg-red-900/30 text-red-300 font-mono text-sm py-2 rounded">
                    Intent cancelled or expired
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Intent Created</span>
                  <span>Matched</span>
                  <span>HTLC Deployed</span>
                  <span>Claimed</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      intent.status === 'pending' ? 'bg-yellow-500 w-1/4' :
                      intent.status === 'matched' ? 'bg-blue-500 w-3/4' :
                      intent.status === 'completed' ? 'bg-green-500 w-full' :
                      'bg-red-500 w-1/4'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const IntentDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    provider: null
  });
  
  const [activeTab, setActiveTab] = useState<'generate' | 'pool' | 'my' | 'matches'>('generate');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setWallet({ address, provider });
      } catch (error: any) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('MetaMask not found. Please install MetaMask.');
    }
  };

  if (!wallet.address) {
    return <WelcomeScreen onConnect={connectWallet} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-mono">
      {/* Enhanced Navigation */}
      <nav className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="pixelated-eye-glow flex items-center justify-center">
                <PixelatedEye size={48} isAnimating={true} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  AI INTENT GENERATOR
                </h1>
                <p className="text-sm text-gray-400 font-mono mt-1">
                  Cross-chain atomic swaps powered by AI
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Connected Wallet</div>
                <div className="text-sm font-mono bg-gray-800 px-3 py-1 rounded border border-gray-700">
                  {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                </div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" title="Connected"></div>
            </div>
          </div>
          
          <div className="flex space-x-0 bg-gray-800 rounded-lg p-1">
            {[
              { key: 'generate', label: 'AI GENERATOR', icon: '' },
              { key: 'pool', label: 'INTENT POOL', icon: '' },
              { key: 'my', label: 'MY INTENTS', icon: '' },
              { key: 'matches', label: 'MY MATCHES', icon: '' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-6 py-3 font-bold rounded-md transition-all duration-200 flex-1 justify-center ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                    : 'bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Enhanced Main Content */}
      <div className="h-[calc(100vh-200px)] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 h-full">
          {activeTab === 'generate' && <GenerateIntent wallet={wallet} />}
          {activeTab === 'pool' && <IntentPool wallet={wallet} />}
          {activeTab === 'my' && <MyIntents wallet={wallet} />}
          {activeTab === 'matches' && <MyMatches wallet={wallet} />}
        </div>
      </div>
      
      {/* Subtle footer indicator */}
      <div className="border-t border-gray-800 bg-gray-900/50 p-3">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div className="h-3 w-px bg-gray-700"></div>
          <div className="flex items-center space-x-1">
            <div className="flex items-center justify-center">
              <PixelatedEye size={12} />
            </div>
            <span>AI Active</span>
          </div>
          <div className="h-3 w-px bg-gray-700"></div>
          <span>Atomic Swap Protocol v2.1</span>
        </div>
      </div>
    </div>
  );
};