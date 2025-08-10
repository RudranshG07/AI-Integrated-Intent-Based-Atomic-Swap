// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AtomicSwapHTLC
 * @dev Hash Time Locked Contract for atomic swaps between chains
 */
contract AtomicSwapHTLC is ReentrancyGuard {
    
    struct SwapContract {
        address initiator;
        address participant;
        address tokenAddress; // address(0) for native currency
        bytes32 hashLock;
        uint256 timelock;
        uint256 amount;
        bool withdrawn;
        bool refunded;
        string swapId; // For tracking cross-chain swaps
    }

    mapping(bytes32 => SwapContract) public swaps;
    mapping(string => bytes32[]) public swapsBySwapId; // Track related swaps
    
    event SwapInitiated(
        bytes32 indexed contractId,
        address indexed initiator,
        address indexed participant,
        address tokenAddress,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        string swapId
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

    modifier onlyInitiator(bytes32 _contractId) {
        require(msg.sender == swaps[_contractId].initiator, "Not the initiator");
        _;
    }

    modifier onlyParticipant(bytes32 _contractId) {
        require(msg.sender == swaps[_contractId].participant, "Not the participant");
        _;
    }

    modifier swapExists(bytes32 _contractId) {
        require(swaps[_contractId].initiator != address(0), "Swap does not exist");
        _;
    }

    modifier withdrawable(bytes32 _contractId) {
        require(!swaps[_contractId].withdrawn, "Already withdrawn");
        require(!swaps[_contractId].refunded, "Already refunded");
        _;
    }

    modifier refundable(bytes32 _contractId) {
        require(!swaps[_contractId].withdrawn, "Already withdrawn");
        require(!swaps[_contractId].refunded, "Already refunded");
        require(block.timestamp >= swaps[_contractId].timelock, "Timelock not yet passed");
        _;
    }

    /**
     * @dev Initiate a swap for native currency (ETH/AVAX)
     */
    function initiateNativeSwap(
        address _participant,
        bytes32 _hashLock,
        uint256 _timelock,
        string memory _swapId
    ) external payable returns (bytes32 contractId) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_timelock > block.timestamp, "Timelock must be in the future");
        require(_participant != address(0), "Invalid participant address");
        require(_participant != msg.sender, "Cannot swap with yourself");

        contractId = keccak256(
            abi.encodePacked(msg.sender, _participant, _hashLock, _timelock, block.timestamp)
        );
        
        require(swaps[contractId].initiator == address(0), "Swap already exists");

        swaps[contractId] = SwapContract({
            initiator: msg.sender,
            participant: _participant,
            tokenAddress: address(0), // Native currency
            hashLock: _hashLock,
            timelock: _timelock,
            amount: msg.value,
            withdrawn: false,
            refunded: false,
            swapId: _swapId
        });

        swapsBySwapId[_swapId].push(contractId);

        emit SwapInitiated(
            contractId,
            msg.sender,
            _participant,
            address(0),
            msg.value,
            _hashLock,
            _timelock,
            _swapId
        );

        return contractId;
    }

    /**
     * @dev Initiate a swap for ERC20 tokens
     */
    function initiateTokenSwap(
        address _participant,
        address _tokenAddress,
        uint256 _amount,
        bytes32 _hashLock,
        uint256 _timelock,
        string memory _swapId
    ) external returns (bytes32 contractId) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_timelock > block.timestamp, "Timelock must be in the future");
        require(_participant != address(0), "Invalid participant address");
        require(_participant != msg.sender, "Cannot swap with yourself");
        require(_tokenAddress != address(0), "Invalid token address");

        contractId = keccak256(
            abi.encodePacked(msg.sender, _participant, _hashLock, _timelock, block.timestamp)
        );
        
        require(swaps[contractId].initiator == address(0), "Swap already exists");

        // Transfer tokens to contract
        IERC20 token = IERC20(_tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        swaps[contractId] = SwapContract({
            initiator: msg.sender,
            participant: _participant,
            tokenAddress: _tokenAddress,
            hashLock: _hashLock,
            timelock: _timelock,
            amount: _amount,
            withdrawn: false,
            refunded: false,
            swapId: _swapId
        });

        swapsBySwapId[_swapId].push(contractId);

        emit SwapInitiated(
            contractId,
            msg.sender,
            _participant,
            _tokenAddress,
            _amount,
            _hashLock,
            _timelock,
            _swapId
        );

        return contractId;
    }

    /**
     * @dev Withdraw funds by revealing the secret
     */
    function withdraw(bytes32 _contractId, bytes32 _secret)
        external
        swapExists(_contractId)
        onlyParticipant(_contractId)
        withdrawable(_contractId)
        nonReentrant
    {
        SwapContract storage swap = swaps[_contractId];
        
        require(keccak256(abi.encodePacked(_secret)) == swap.hashLock, "Invalid secret");

        swap.withdrawn = true;

        if (swap.tokenAddress == address(0)) {
            // Native currency
            payable(swap.participant).transfer(swap.amount);
        } else {
            // ERC20 token
            IERC20 token = IERC20(swap.tokenAddress);
            require(token.transfer(swap.participant, swap.amount), "Token transfer failed");
        }

        emit SwapWithdrawn(_contractId, _secret, block.timestamp);
    }

    /**
     * @dev Refund funds after timelock expires
     */
    function refund(bytes32 _contractId)
        external
        swapExists(_contractId)
        onlyInitiator(_contractId)
        refundable(_contractId)
        nonReentrant
    {
        SwapContract storage swap = swaps[_contractId];
        
        swap.refunded = true;

        if (swap.tokenAddress == address(0)) {
            // Native currency
            payable(swap.initiator).transfer(swap.amount);
        } else {
            // ERC20 token
            IERC20 token = IERC20(swap.tokenAddress);
            require(token.transfer(swap.initiator, swap.amount), "Token transfer failed");
        }

        emit SwapRefunded(_contractId, block.timestamp);
    }

    /**
     * @dev Get swap details
     */
    function getSwap(bytes32 _contractId) external view returns (
        address initiator,
        address participant,
        address tokenAddress,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        bool withdrawn,
        bool refunded,
        string memory swapId
    ) {
        SwapContract storage swap = swaps[_contractId];
        return (
            swap.initiator,
            swap.participant,
            swap.tokenAddress,
            swap.amount,
            swap.hashLock,
            swap.timelock,
            swap.withdrawn,
            swap.refunded,
            swap.swapId
        );
    }

    /**
     * @dev Get all contract IDs for a swap ID
     */
    function getSwapContracts(string memory _swapId) external view returns (bytes32[] memory) {
        return swapsBySwapId[_swapId];
    }

    /**
     * @dev Check if contract can be withdrawn
     */
    function isWithdrawable(bytes32 _contractId, bytes32 _secret) external view returns (bool) {
        SwapContract storage swap = swaps[_contractId];
        return !swap.withdrawn && 
               !swap.refunded && 
               keccak256(abi.encodePacked(_secret)) == swap.hashLock;
    }

    /**
     * @dev Check if contract can be refunded
     */
    function isRefundable(bytes32 _contractId) external view returns (bool) {
        SwapContract storage swap = swaps[_contractId];
        return !swap.withdrawn && 
               !swap.refunded && 
               block.timestamp >= swap.timelock;
    }

    /**
     * @dev Emergency function to check contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Emergency function to check token balance
     */
    function getTokenBalance(address _tokenAddress) external view returns (uint256) {
        if (_tokenAddress == address(0)) {
            return address(this).balance;
        }
        return IERC20(_tokenAddress).balanceOf(address(this));
    }
}