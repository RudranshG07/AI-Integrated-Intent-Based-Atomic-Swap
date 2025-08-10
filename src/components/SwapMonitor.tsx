import React, { useState, useEffect } from 'react';
import { web3Service } from '../services/web3';
import { SwapData } from '../types';
import { NETWORKS } from '../config/networks';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SwapMonitorProps {
  refreshTrigger: number;
}

export const SwapMonitor: React.FC<SwapMonitorProps> = ({ refreshTrigger }) => {
  const [contractId, setContractId] = useState('');
  const [network, setNetwork] = useState('fuji');
  const [swapData, setSwapData] = useState<SwapData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!contractId.trim()) return;
    
    setLoading(true);
    try {
      const data = await web3Service.getSwapDetails(contractId, network);
      setSwapData(data);
    } catch (error: any) {
      alert(`Error fetching swap: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!swapData) return;
    
    setLoading(true);
    try {
      await web3Service.refundSwap(swapData.contractId, network);
      alert('Refund successful!');
      handleSearch(); // Refresh data
    } catch (error: any) {
      alert(`Error processing refund: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (timelock: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = timelock - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusIcon = (swap: SwapData) => {
    if (swap.withdrawn) return <CheckCircle className="text-green-500" size={20} />;
    if (swap.refunded) return <XCircle className="text-red-500" size={20} />;
    
    const now = Math.floor(Date.now() / 1000);
    if (swap.timelock <= now) return <AlertCircle className="text-orange-500" size={20} />;
    
    return <Clock className="text-blue-500" size={20} />;
  };

  const getStatusText = (swap: SwapData) => {
    if (swap.withdrawn) return 'Completed';
    if (swap.refunded) return 'Refunded';
    
    const now = Math.floor(Date.now() / 1000);
    if (swap.timelock <= now) return 'Expired - Refundable';
    
    return 'Active';
  };

  useEffect(() => {
    if (contractId && refreshTrigger > 0) {
      handleSearch();
    }
  }, [refreshTrigger]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Monitor Swap</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
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
          <div className="flex gap-2">
            <input
              type="text"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !contractId.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {swapData && (
          <div className="border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Swap Details</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(swapData)}
                  <span className="text-sm font-medium">{getStatusText(swapData)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Initiator:</span>
                  <div className="font-mono text-xs">{swapData.initiator}</div>
                </div>
                <div>
                  <span className="text-gray-600">Participant:</span>
                  <div className="font-mono text-xs">{swapData.participant}</div>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <div className="font-semibold">{swapData.amount} {NETWORKS[swapData.network]?.nativeCurrency.symbol}</div>
                </div>
                <div>
                  <span className="text-gray-600">Time Remaining:</span>
                  <div className="font-semibold">{getTimeRemaining(swapData.timelock)}</div>
                </div>
              </div>
              
              <div>
                <span className="text-gray-600 text-sm">Hash Lock:</span>
                <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {swapData.hashLock}
                </div>
              </div>

              {!swapData.withdrawn && !swapData.refunded && swapData.timelock <= Math.floor(Date.now() / 1000) && (
                <button
                  onClick={handleRefund}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Refund'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};