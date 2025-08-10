import React, { useState } from 'react';
import { web3Service } from '../services/web3';
import { NETWORKS } from '../config/networks';
import { Download, RefreshCw } from 'lucide-react';

interface ClaimSwapProps {
  onSwapClaimed: () => void;
}

export const ClaimSwap: React.FC<ClaimSwapProps> = ({ onSwapClaimed }) => {
  const [formData, setFormData] = useState({
    contractId: '',
    preimage: '',
    network: 'fuji'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await web3Service.claimSwap(formData);
      alert('Swap claimed successfully!');
      onSwapClaimed();
      
      // Reset form
      setFormData({
        contractId: '',
        preimage: '',
        network: 'fuji'
      });
    } catch (error: any) {
      alert(`Error claiming swap: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Claim Atomic Swap</h2>
      
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
            Contract ID
          </label>
          <input
            type="text"
            value={formData.contractId}
            onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secret/Preimage
          </label>
          <input
            type="text"
            value={formData.preimage}
            onChange={(e) => setFormData({ ...formData, preimage: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            Enter the secret revealed by the other party
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
          {loading ? 'Claiming...' : 'Claim Swap'}
        </button>
      </form>
    </div>
  );
};