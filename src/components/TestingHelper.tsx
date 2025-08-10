import React, { useState } from 'react';
import { web3Service } from '../services/web3';
import { Play, AlertTriangle, CheckCircle } from 'lucide-react';

export const TestingHelper: React.FC = () => {
  const [testStep, setTestStep] = useState(1);
  const [testData, setTestData] = useState({
    secret: '',
    contractId1: '',
    contractId2: '',
    yourAddress: ''
  });

  const handleGetAddress = async () => {
    try {
      const walletState = await web3Service.connectWallet();
      setTestData({ ...testData, yourAddress: walletState.account || '' });
    } catch (error) {
      alert('Please connect your wallet first');
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
        <Play size={16} />
        🧪 Easy Testing Mode
      </h3>
      
      <div className="space-y-3 text-sm">
        <div className={`p-3 rounded ${testStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">Step 1: Get Your Address</span>
            {testStep >= 1 && <CheckCircle className="text-green-600" size={16} />}
          </div>
          <p className="text-gray-600 mt-1">Use this as the "participant" to test with yourself</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleGetAddress}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Get My Address
            </button>
            {testData.yourAddress && (
              <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                {testData.yourAddress}
              </span>
            )}
          </div>
        </div>

        <div className={`p-3 rounded ${testStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
          <span className="font-medium">Step 2: Create First Swap</span>
          <ul className="text-gray-600 mt-1 ml-4 list-disc">
            <li>Network: Fuji Testnet</li>
            <li>Participant: Your address (from Step 1)</li>
            <li>Amount: 0.01 AVAX (small test amount)</li>
            <li>Save the Contract ID and Secret!</li>
          </ul>
        </div>

        <div className={`p-3 rounded ${testStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
          <span className="font-medium">Step 3: Create Counter Swap</span>
          <ul className="text-gray-600 mt-1 ml-4 list-disc">
            <li>Network: Sepolia Testnet</li>
            <li>Use SAME secret hash (copy from Step 2)</li>
            <li>Amount: 0.005 ETH (equivalent test amount)</li>
          </ul>
        </div>

        <div className={`p-3 rounded ${testStep >= 4 ? 'bg-green-100' : 'bg-gray-100'}`}>
          <span className="font-medium">Step 4: Claim Both Swaps</span>
          <ul className="text-gray-600 mt-1 ml-4 list-disc">
            <li>First: Claim on Sepolia (reveals secret)</li>
            <li>Then: Claim on Fuji (using same secret)</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="flex items-start gap-2">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-medium text-yellow-800">Important Tips:</p>
            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
              <li>• Start with small amounts (0.01 AVAX / 0.005 ETH)</li>
              <li>• Keep your browser's Developer Console open to see transaction logs</li>
              <li>• Make sure you have testnet tokens in both networks</li>
              <li>• The secret must be exactly the same for both swaps</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};