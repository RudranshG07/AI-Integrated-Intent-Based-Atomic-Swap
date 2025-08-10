// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Enhanced HTLC (Hash Time Locked Contract) with Privacy and Auto-Refund
 * @dev Supports private intent-based atomic swaps with automatic refunds
 */
contract EnhancedHTLC {
    
    struct HTLCContract {
        address initiator;
        address participant;
        bytes32 hashLock;
        uint256 timelock;
        uint256 amount;
        bool withdrawn;
        bool refunded;
        bool exists;
        bytes32 secret; // Stores revealed secret
        uint256 createdAt;
    }

    struct PrivateIntent {
        bytes32 commitment; // hash(address + nonce)
        uint256 amount;
        address tokenAddress; // address(0) for native currency
        uint256 timelock;
        bool matched;
        bool cancelled;
        uint256 createdAt;
    }

    mapping(bytes32 => HTLCContract) public contracts;
    mapping(bytes32 => PrivateIntent) public intents;
    mapping(address => bytes32[]) public userContracts;
    mapping(address => bytes32[]) public userIntents;

    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 24 hours;
    uint256 public constant INTENT_EXPIRY = 6 hours;

    event IntentCreated(
        bytes32 indexed intentId,
        bytes32 indexed commitment,
        uint256 amount,
        address tokenAddress,
        uint256 timelock,
        uint256 createdAt
    );

    event IntentMatched(
        bytes32 indexed intentIdA,
        bytes32 indexed intentIdB,
        bytes32 indexed htlcId
    );

    event HTLCNew(
        bytes32 indexed contractId,
        address indexed initiator,
        address indexed participant,
        bytes32 hashLock,
        uint256 timelock,
        uint256 amount,
        uint256 createdAt
    );

    event HTLCWithdraw(
        bytes32 indexed contractId,
        bytes32 secret,
        address indexed withdrawer,
        uint256 withdrawnAt
    );

    event HTLCRefund(
        bytes32 indexed contractId,
        address indexed refunder,
        uint256 refundedAt
    );

    event AutoRefundExecuted(
        bytes32 indexed contractId,
        address indexed originalInitiator,
        uint256 amount,
        uint256 executedAt
    );

    modifier contractExists(bytes32 _contractId) {
        require(contracts[_contractId].exists, "Contract does not exist");
        _;
    }

    modifier hasEnoughBalance(uint256 _amount) {
        require(msg.value >= _amount, "Insufficient balance");
        _;
    }

    modifier validTimelock(uint256 _timelock) {
        require(_timelock >= MIN_TIMELOCK && _timelock <= MAX_TIMELOCK, "Invalid timelock");
        _;
    }

    /**
     * @dev Create a private intent with commitment scheme
     * @param _commitment Hash of (user_address + nonce)
     * @param _timelock Lock time for the intent
     */
    function createPrivateIntent(
        bytes32 _commitment,
        uint256 _timelock
    ) external payable validTimelock(_timelock) {
        require(msg.value > 0, "Amount must be greater than 0");
        
        bytes32 intentId = keccak256(
            abi.encodePacked(_commitment, block.timestamp, msg.sender)
        );

        intents[intentId] = PrivateIntent({
            commitment: _commitment,
            amount: msg.value,
            tokenAddress: address(0), // Native currency
            timelock: _timelock,
            matched: false,
            cancelled: false,
            createdAt: block.timestamp
        });

        userIntents[msg.sender].push(intentId);

        emit IntentCreated(
            intentId,
            _commitment,
            msg.value,
            address(0),
            _timelock,
            block.timestamp
        );
    }

    /**
     * @dev Match two intents and create HTLCs
     * @param _intentIdA First intent ID
     * @param _intentIdB Second intent ID
     * @param _addressA Revealed address for intent A
     * @param _addressB Revealed address for intent B
     * @param _nonceA Nonce for intent A
     * @param _nonceB Nonce for intent B
     * @param _hashLock Shared hash lock for both HTLCs
     */
    function matchIntentsAndCreateHTLC(
        bytes32 _intentIdA,
        bytes32 _intentIdB,
        address _addressA,
        address _addressB,
        bytes32 _nonceA,
        bytes32 _nonceB,
        bytes32 _hashLock
    ) external {
        PrivateIntent storage intentA = intents[_intentIdA];
        PrivateIntent storage intentB = intents[_intentIdB];

        // Verify intents exist and are not matched
        require(!intentA.matched && !intentA.cancelled, "Intent A already processed");
        require(!intentB.matched && !intentB.cancelled, "Intent B already processed");

        // Verify commitments
        require(
            intentA.commitment == keccak256(abi.encodePacked(_addressA, _nonceA)),
            "Invalid commitment for intent A"
        );
        require(
            intentB.commitment == keccak256(abi.encodePacked(_addressB, _nonceB)),
            "Invalid commitment for intent B"
        );

        // Check intent expiry
        require(
            block.timestamp <= intentA.createdAt + INTENT_EXPIRY,
            "Intent A expired"
        );
        require(
            block.timestamp <= intentB.createdAt + INTENT_EXPIRY,
            "Intent B expired"
        );

        // Create HTLC contracts
        bytes32 htlcId = keccak256(
            abi.encodePacked(_intentIdA, _intentIdB, block.timestamp)
        );

        // Create contract for intent A -> B
        contracts[htlcId] = HTLCContract({
            initiator: _addressA,
            participant: _addressB,
            hashLock: _hashLock,
            timelock: block.timestamp + intentA.timelock,
            amount: intentA.amount,
            withdrawn: false,
            refunded: false,
            exists: true,
            secret: bytes32(0),
            createdAt: block.timestamp
        });

        // Mark intents as matched
        intentA.matched = true;
        intentB.matched = true;

        // Track user contracts
        userContracts[_addressA].push(htlcId);
        userContracts[_addressB].push(htlcId);

        emit IntentMatched(_intentIdA, _intentIdB, htlcId);
        emit HTLCNew(
            htlcId,
            _addressA,
            _addressB,
            _hashLock,
            block.timestamp + intentA.timelock,
            intentA.amount,
            block.timestamp
        );
    }

    /**
     * @dev Withdraw funds from HTLC by revealing the secret
     * @param _contractId Contract ID
     * @param _secret The secret that unlocks the contract
     */
    function withdraw(bytes32 _contractId, bytes32 _secret)
        external
        contractExists(_contractId)
    {
        HTLCContract storage htlc = contracts[_contractId];
        
        require(!htlc.withdrawn, "Already withdrawn");
        require(!htlc.refunded, "Already refunded");
        require(msg.sender == htlc.participant, "Not the participant");
        require(keccak256(abi.encodePacked(_secret)) == htlc.hashLock, "Invalid secret");

        htlc.withdrawn = true;
        htlc.secret = _secret; // Store the revealed secret

        // Transfer funds to participant
        payable(htlc.participant).transfer(htlc.amount);

        emit HTLCWithdraw(_contractId, _secret, msg.sender, block.timestamp);
    }

    /**
     * @dev Refund the initiator after timelock expires
     * @param _contractId Contract ID
     */
    function refund(bytes32 _contractId)
        external
        contractExists(_contractId)
    {
        HTLCContract storage htlc = contracts[_contractId];
        
        require(!htlc.withdrawn, "Already withdrawn");
        require(!htlc.refunded, "Already refunded");
        require(block.timestamp >= htlc.timelock, "Timelock not yet expired");
        require(msg.sender == htlc.initiator, "Not the initiator");

        htlc.refunded = true;

        // Return funds to initiator
        payable(htlc.initiator).transfer(htlc.amount);

        emit HTLCRefund(_contractId, msg.sender, block.timestamp);
    }

    /**
     * @dev Auto-refund expired contracts (can be called by anyone for gas efficiency)
     * @param _contractId Contract ID
     */
    function autoRefund(bytes32 _contractId)
        external
        contractExists(_contractId)
    {
        HTLCContract storage htlc = contracts[_contractId];
        
        require(!htlc.withdrawn, "Already withdrawn");
        require(!htlc.refunded, "Already refunded");
        require(block.timestamp >= htlc.timelock + 1 hours, "Grace period not expired");

        htlc.refunded = true;

        // Return funds to original initiator
        payable(htlc.initiator).transfer(htlc.amount);

        emit AutoRefundExecuted(_contractId, htlc.initiator, htlc.amount, block.timestamp);
    }

    /**
     * @dev Batch auto-refund for multiple expired contracts
     * @param _contractIds Array of contract IDs to refund
     */
    function batchAutoRefund(bytes32[] calldata _contractIds) external {
        for (uint256 i = 0; i < _contractIds.length; i++) {
            bytes32 contractId = _contractIds[i];
            
            if (!contracts[contractId].exists) continue;
            
            HTLCContract storage htlc = contracts[contractId];
            
            if (htlc.withdrawn || htlc.refunded) continue;
            if (block.timestamp < htlc.timelock + 1 hours) continue;

            htlc.refunded = true;
            payable(htlc.initiator).transfer(htlc.amount);
            
            emit AutoRefundExecuted(contractId, htlc.initiator, htlc.amount, block.timestamp);
        }
    }

    /**
     * @dev Get revealed secret from a withdrawn contract
     * @param _contractId Contract ID
     * @return The revealed secret (if any)
     */
    function getRevealedSecret(bytes32 _contractId)
        external
        view
        contractExists(_contractId)
        returns (bytes32)
    {
        return contracts[_contractId].secret;
    }

    /**
     * @dev Check if a contract can be auto-refunded
     * @param _contractId Contract ID
     * @return Whether the contract can be auto-refunded
     */
    function canAutoRefund(bytes32 _contractId)
        external
        view
        contractExists(_contractId)
        returns (bool)
    {
        HTLCContract storage htlc = contracts[_contractId];
        return !htlc.withdrawn && 
               !htlc.refunded && 
               block.timestamp >= htlc.timelock + 1 hours;
    }

    /**
     * @dev Get user's contracts
     * @param _user User address
     * @return Array of contract IDs
     */
    function getUserContracts(address _user) external view returns (bytes32[] memory) {
        return userContracts[_user];
    }

    /**
     * @dev Get user's intents
     * @param _user User address
     * @return Array of intent IDs
     */
    function getUserIntents(address _user) external view returns (bytes32[] memory) {
        return userIntents[_user];
    }

    /**
     * @dev Get contract details
     * @param _contractId Contract ID
     * @return Contract details
     */
    function getContract(bytes32 _contractId)
        external
        view
        contractExists(_contractId)
        returns (HTLCContract memory)
    {
        return contracts[_contractId];
    }

    /**
     * @dev Get intent details
     * @param _intentId Intent ID
     * @return Intent details
     */
    function getIntent(bytes32 _intentId)
        external
        view
        returns (PrivateIntent memory)
    {
        return intents[_intentId];
    }

    /**
     * @dev Cancel an unmatched intent and refund
     * @param _intentId Intent ID
     */
    function cancelIntent(bytes32 _intentId) external {
        PrivateIntent storage intent = intents[_intentId];
        
        require(!intent.matched, "Intent already matched");
        require(!intent.cancelled, "Intent already cancelled");
        require(block.timestamp >= intent.createdAt + INTENT_EXPIRY, "Intent not yet expired");
        
        intent.cancelled = true;
        
        // Refund the intent creator (this is a simple approach, in production you'd want more sophisticated tracking)
        payable(msg.sender).transfer(intent.amount);
    }
}