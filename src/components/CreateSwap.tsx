import React, { useState } from 'react';
import { web3Service } from '../services/web3';
import { NETWORKS } from '../config/networks';
import { ArrowRight, Copy, Check, AlertCircle } from 'lucide-react';

interface CreateSwapProps {
  onSwapCreated: (contractId: string, secret: string, hash: string) => void;
}

export const CreateSwap: React.FC<CreateSwapProps> = ({ onSwapCreated }) => {
  const [formData, setFormData] = useState({
    participant: '',
    amount: '0.01', // Default small amount for testing
    timelock: '3600',
    network: 'fuji'
  });
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState<{ secret: string; hash: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerateSecret = () => {
    try {
      const secretData = web3Service.generateSecret();
      setSecret(secretData);
      setError('');
    } catch (err: any) {
      setError('Failed to generate secret: ' + err.message);
    }
  };

  const handleCopySecret = async () => {
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert('Failed to copy secret. Please copy manually.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!secret) {
      setError('Please generate a secret first');
      return;
    }

    if (!formData.participant || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting swap creation...');
      const contractId = await web3Service.createSwap({
        ...formData,
        hashLock: secret.hash,
        timelock: parseInt(formData.timelock)
      });
      
      alert(`✅ Swap Created Successfully!\n\nContract ID: ${contractId}\n\n⚠️ IMPORTANT: Save your secret safely:\n${secret.secret}\n\nYou'll need this secret to complete the swap!`);
      
      onSwapCreated(contractId, secret.secret, secret.hash);
      
      // Reset form
      setFormData({
        participant: '',
        amount: '0.01',
        timelock: '3600',
        network: 'fuji'
      });
      setSecret(null);
    } catch (error: any) {
      console.error('Swap creation error:', error);
      setError(`Failed to create swap: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Atomic Swap</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-800 mb-2">📝 Simple Steps:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Generate a secret (keep it safe!)</li>
          <li>2. Enter the other person's wallet address</li>
          <li>3. Set how much you want to swap</li>
          <li>4. Create the swap and share the Contract ID</li>
        </ol>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network
          </label>
          <select
            value={formData.network}
            onChange={(e) => setFormData({ ...formData, network: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(NETWORKS).map(([key, network]) => (
              <option key={key} value={key}>
                {network.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participant Address
          </label>
          <input
            type="text"
            value={formData.participant}
            onChange={(e) => setFormData({ ...formData, participant: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount ({NETWORKS[formData.network]?.nativeCurrency.symbol})
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timelock (seconds)
          </label>
          <select
            value={formData.timelock}
            onChange={(e) => setFormData({ ...formData, timelock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3600">1 Hour</option>
            <option value="7200">2 Hours</option>
            <option value="86400">24 Hours</option>
            <option value="259200">3 Days</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Secret Key
            </label>
            <button
              type="button"
              onClick={handleGenerateSecret}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Generate Secret
            </button>
          </div>
          
          {secret && (
            <div className="bg-gray-50 p-3 rounded border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Secret (keep this safe!):</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs break-all bg-white p-2 rounded border mt-1">
                {secret.secret}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Hash: <span className="font-mono">{secret.hash}</span>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !secret}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'Creating...' : 'Create Swap'}
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};