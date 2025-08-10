// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HTLC {
    enum SwapState { EMPTY, INITIATED, PARTICIPATED, WITHDRAWN, REFUNDED }
    
    struct Swap {
        address payable initiator;
        address payable participant;
        bytes32 hashLock;
        uint256 timelock;
        uint256 amount;
        SwapState state;
        uint256 createdAt;
        uint256 nonce;
    }
    
    // Security constants
    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 7 days;
    uint256 public constant SAFETY_BUFFER = 6 hours;
    
    // Rate limiting
    mapping(address => uint256) public userSwapCount;
    mapping(address => uint256) public lastSwapTime;
    uint256 public constant MAX_SWAPS_PER_USER = 10;
    uint256 public constant RATE_LIMIT_WINDOW = 1 days;
    
    // Emergency controls
    bool public emergencyStop = false;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier notInEmergency() {
        require(!emergencyStop, "Emergency stop activated");
        _;
    }
    
    modifier rateLimited() {
        if (block.timestamp > lastSwapTime[msg.sender] + RATE_LIMIT_WINDOW) {
            userSwapCount[msg.sender] = 0;
        }
        require(userSwapCount[msg.sender] < MAX_SWAPS_PER_USER, "Rate limit exceeded");
        userSwapCount[msg.sender]++;
        lastSwapTime[msg.sender] = block.timestamp;
        _;
    }
    
    mapping(bytes32 => Swap) public swaps;
    
    // Enhanced events for monitoring
    event SwapInitiated(
        bytes32 indexed contractId,
        address indexed initiator,
        address indexed participant,
        bytes32 hashLock,
        uint256 timelock,
        uint256 amount,
        uint256 createdAt
    );
    
    event SwapWithdrawn(
        bytes32 indexed contractId,
        bytes32 secret,
        uint256 withdrawnAt
    );
    
    event SwapRefunded(
        bytes32 indexed contractId,
        uint256 refundedAt
    );
    
    event SwapStateChanged(
        bytes32 indexed contractId,
        SwapState oldState,
        SwapState newState,
        uint256 timestamp
    );
    
    event EmergencyStopToggled(bool stopped, uint256 timestamp);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier fundsSent() {
        require(msg.value > 0, "Must send funds");
        _;
    }
    
    modifier validTimelock(uint256 _time) {
        require(_time > block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(_time <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        _;
    }
    
    modifier contractExists(bytes32 _contractId) {
        require(haveContract(_contractId), "Contract does not exist");
        _;
    }
    
    modifier hashlockMatches(bytes32 _contractId, bytes32 _preimage) {
        require(swaps[_contractId].hashLock == sha256(abi.encodePacked(_preimage)), "Hashlock does not match");
        _;
    }
    
    modifier withdrawable(bytes32 _contractId) {
        Swap storage swap = swaps[_contractId];
        require(swap.participant == msg.sender, "Not authorized");
        require(swap.state == SwapState.INITIATED, "Invalid state for withdrawal");
        require(swap.timelock > block.timestamp, "Timelock expired");
        _;
    }
    
    modifier refundable(bytes32 _contractId) {
        Swap storage swap = swaps[_contractId];
        require(swap.initiator == msg.sender, "Not authorized");
        require(swap.state == SwapState.INITIATED, "Invalid state for refund");
        require(swap.timelock <= block.timestamp, "Timelock not yet passed");
        _;
    }
    
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
        emit EmergencyStopToggled(emergencyStop, block.timestamp);
    }
    
    function newContract(
        address payable _participant,
        bytes32 _hashLock,
        uint256 _timelock
    ) 
        external 
        payable 
        fundsSent 
        validTimelock(_timelock) 
        notInEmergency 
        rateLimited 
        returns (bytes32 contractId) 
    {
        uint256 nonce = block.timestamp + userSwapCount[msg.sender];
        contractId = keccak256(
            abi.encodePacked(
                msg.sender,
                _participant,
                _hashLock,
                _timelock,
                msg.value,
                nonce
            )
        );
        
        require(!haveContract(contractId), "Contract already exists");
        require(_participant != address(0), "Invalid participant address");
        require(_participant != msg.sender, "Cannot swap with yourself");
        
        swaps[contractId] = Swap({
            initiator: payable(msg.sender),
            participant: _participant,
            hashLock: _hashLock,
            timelock: _timelock,
            amount: msg.value,
            state: SwapState.INITIATED,
            createdAt: block.timestamp,
            nonce: nonce
        });
        
        emit SwapInitiated(
            contractId,
            msg.sender,
            _participant,
            _hashLock,
            _timelock,
            msg.value,
            block.timestamp
        );
        
        emit SwapStateChanged(
            contractId,
            SwapState.EMPTY,
            SwapState.INITIATED,
            block.timestamp
        );
        
        return contractId;
    }
    
    function withdraw(bytes32 _contractId, bytes32 _preimage)
        external
        notInEmergency
        contractExists(_contractId)
        hashlockMatches(_contractId, _preimage)
        withdrawable(_contractId)
        returns (bool)
    {
        Swap storage swap = swaps[_contractId];
        SwapState oldState = swap.state;
        
        swap.state = SwapState.WITHDRAWN;
        
        emit SwapStateChanged(
            _contractId,
            oldState,
            SwapState.WITHDRAWN,
            block.timestamp
        );
        
        emit SwapWithdrawn(_contractId, _preimage, block.timestamp);
        
        (bool success, ) = swap.participant.call{value: swap.amount}("");
        require(success, "Transfer failed");
        
        return true;
    }
    
    function refund(bytes32 _contractId)
        external
        contractExists(_contractId)
        refundable(_contractId)
        returns (bool)
    {
        Swap storage swap = swaps[_contractId];
        SwapState oldState = swap.state;
        
        swap.state = SwapState.REFUNDED;
        
        emit SwapStateChanged(
            _contractId,
            oldState,
            SwapState.REFUNDED,
            block.timestamp
        );
        
        emit SwapRefunded(_contractId, block.timestamp);
        
        (bool success, ) = swap.initiator.call{value: swap.amount}("");
        require(success, "Transfer failed");
        
        return true;
    }
    
    function getContract(bytes32 _contractId)
        public
        view
        returns (
            address initiator,
            address participant,
            bytes32 hashLock,
            uint256 timelock,
            uint256 amount,
            SwapState state,
            uint256 createdAt
        )
    {
        if (!haveContract(_contractId))
            return (address(0), address(0), 0, 0, 0, SwapState.EMPTY, 0);
        
        Swap storage swap = swaps[_contractId];
        return (
            swap.initiator,
            swap.participant,
            swap.hashLock,
            swap.timelock,
            swap.amount,
            swap.state,
            swap.createdAt
        );
    }
    
    function getContractStatus(bytes32 _contractId)
        external
        view
        returns (
            SwapState state,
            uint256 timeRemaining,
            bool isExpired
        )
    {
        if (!haveContract(_contractId)) {
            return (SwapState.EMPTY, 0, false);
        }
        
        Swap storage swap = swaps[_contractId];
        bool expired = block.timestamp >= swap.timelock;
        uint256 remaining = expired ? 0 : swap.timelock - block.timestamp;
        
        return (swap.state, remaining, expired);
    }
    
    function batchRefund(bytes32[] calldata _contractIds) external {
        for (uint256 i = 0; i < _contractIds.length; i++) {
            bytes32 contractId = _contractIds[i];
            if (haveContract(contractId)) {
                Swap storage swap = swaps[contractId];
                if (swap.initiator == msg.sender && 
                    swap.state == SwapState.INITIATED && 
                    swap.timelock <= block.timestamp) {
                    
                    swap.state = SwapState.REFUNDED;
                    emit SwapStateChanged(contractId, SwapState.INITIATED, SwapState.REFUNDED, block.timestamp);
                    emit SwapRefunded(contractId, block.timestamp);
                    
                    (bool success, ) = swap.initiator.call{value: swap.amount}("");
                    require(success, "Transfer failed");
                }
            }
        }
    }
    
    function haveContract(bytes32 _contractId) internal view returns (bool) {
        return swaps[_contractId].initiator != address(0);
    }
    
    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
    
    receive() external payable {
        revert("Direct payments not accepted");
    }
}