// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureMessenger
 * @author Antigravity
 * @notice A professional-grade decentralised messaging protocol for off-chain encrypted communications.
 * @dev This contract acts as an on-chain registry for public keys and a message routing system.
 * Messages are encrypted off-chain using the recipient's public key (e.g., X25519) and stored on-chain
 * as an immutable audit trail or for asynchronous retrieval.
 *
 * Flow:
 * 1. User registers their encryption Public Key.
 * 2. Sender fetches recipient's Public Key.
 * 3. Sender encrypts the message off-chain using the Public Key.
 * 4. Sender calls sendMessage() to store the cipher-text.
 * 5. Recipient retrieves and decrypts the cipher-text locally using their Private Key.
 */
contract SecureMessenger {
    
    struct MessageMeta {
        address sender;
        uint256 timestamp;
        uint64 replyToId; // Optional: reference to a previous message index
    }

    struct EncryptedMessage {
        MessageMeta meta;
        bytes content; // The actual encrypted cipher-text bytes
    }

    /// @notice Maps a user's address to their registered encryption public key (e.g., X25519)
    mapping(address => bytes) public userPublicKeys;
    
    /// @notice Inbox storage: Mapping from recipient address to their list of received encrypted messages
    mapping(address => EncryptedMessage[]) private inboxes;

    /// @notice Global message counter for total platform volume tracking
    uint256 public totalMessagesSent;

    /// @notice Emitted when a user updates their encryption public key
    event PublicKeyUpdated(address indexed user, bytes publicKey);
    
    /// @notice Emitted when a new encrypted message is broadcasted
    event MessageSent(
        address indexed from,
        address indexed to,
        uint256 indexed messageId,
        uint256 timestamp
    );

    /**
     * @notice Register or update your cryptographic public key for incoming message encryption.
     * @param _publicKey The raw bytes of the public key (typically 32 bytes for X25519).
     */
    function registerPublicKey(bytes calldata _publicKey) external {
        require(_publicKey.length > 0, "Invalid public key length");
        userPublicKeys[msg.sender] = _publicKey;
        emit PublicKeyUpdated(msg.sender, _publicKey);
    }

    /**
     * @notice Dispatches an encrypted message to a recipient's inbox.
     * @param _to The Ethereum address of the intended recipient.
     * @param _content The encrypted cipher-text bytes produced off-chain.
     * @param _replyToId The index of the message being replied to (0 if N/A).
     */
    function sendMessage(address _to, bytes calldata _content, uint64 _replyToId) external {
        require(userPublicKeys[_to].length > 0, "Recipient has not registered a public key");
        require(_content.length > 0, "Message content cannot be empty");

        EncryptedMessage memory newMessage = EncryptedMessage({
            meta: MessageMeta({
                sender: msg.sender,
                timestamp: block.timestamp,
                replyToId: _replyToId
            }),
            content: _content
        });

        inboxes[_to].push(newMessage);
        totalMessagesSent++;

        emit MessageSent(msg.sender, _to, inboxes[_to].length - 1, block.timestamp);
    }

    /**
     * @notice Fetches the public key of a user.
     * @param _user The address of the user.
     * @return The registered public key bytes.
     */
    function getPublicKey(address _user) external view returns (bytes memory) {
        return userPublicKeys[_user];
    }

    /**
     * @notice Retrieves all messages for the caller's inbox.
     * @return An array of EncryptedMessage structs for self-decryption.
     */
    function getMyMessages() external view returns (EncryptedMessage[] memory) {
        return inboxes[msg.sender];
    }

    /**
     * @notice Retrieves a specific message by index from the caller's inbox.
     * @param _index The index of the message in the inbox array.
     * @return The EncryptedMessage struct.
     */
    function getMessageByIndex(uint256 _index) external view returns (EncryptedMessage memory) {
        require(_index < inboxes[msg.sender].length, "Index out of bounds");
        return inboxes[msg.sender][_index];
    }

    /**
     * @notice Returns the total number of messages received by the caller.
     * @return The inbox message count.
     */
    function getInboxSize() external view returns (uint256) {
        return inboxes[msg.sender].length;
    }

    /**
     * @notice Optional: Clear your inbox to save on storage (if users want to 'burn' messages).
     * @dev This reduces contract state but doesn't remove the history from the blockchain's historical nodes.
     */
    function purgeInbox() external {
        delete inboxes[msg.sender];
    }
}
