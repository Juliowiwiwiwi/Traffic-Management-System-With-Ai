from web3 import Web3
import json
from eth_account import Account

GANACHE_URL = "http://127.0.0.1:8545"
# Default Ganache CLI First Account Key
PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CONTRACT_ADDRESS = None  # Will be set dynamically

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))


try:
    with open("blockchain/build/blockchain_contracts_ViolationAuditV2_sol_ViolationAuditV2.abi") as f:
        abi = json.load(f)
    with open("blockchain/build/blockchain_contracts_ViolationAuditV2_sol_ViolationAuditV2.bin") as f:
        bytecode = f.read()
except FileNotFoundError:
    print("Warning: Contract ABI/BIN not found. Please compile the contracts.")
    abi = None
    bytecode = None

contract = None
account = None

def setup_blockchain(w3_instance=None):
    global w3, account, contract, CONTRACT_ADDRESS
    if w3_instance:
        w3 = w3_instance
    if not w3.is_connected():
        print("Failed to connect to Ganache")
        return False
        
    try:
        # Use the first account from Ganache
        account = w3.eth.accounts[0]
        print(f"Using account: {account}")
        
        # Deploy contract
        if not abi or not bytecode:
             print("Cannot deploy contract, missing ABI or bytecode")
             return False

        ViolationAudit = w3.eth.contract(abi=abi, bytecode=bytecode)
        tx_hash = ViolationAudit.constructor().transact({'from': account})
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        CONTRACT_ADDRESS = tx_receipt.contractAddress
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
        print(f"Contract deployed automatically to: {CONTRACT_ADDRESS}")
        return True
    except Exception as e:
        print(f"Error setting up blockchain: {e}")
        return False

def anchor_violation_on_chain(violation_id, violation_hash, evidence_hash=b""):
    if contract is None or account is None:
        print("Blockchain not initialized. Call setup_blockchain() first.")
        return None

    # Convert strings to bytes32 format expected by Solidity
    if isinstance(violation_hash, str):
        v_hash_bytes = Web3.to_bytes(text=violation_hash).ljust(32, b'\0')[:32]
    else:
        v_hash_bytes = violation_hash.ljust(32, b'\0')[:32]

    if isinstance(evidence_hash, str):
        e_hash_bytes = Web3.to_bytes(text=evidence_hash).ljust(32, b'\0')[:32]
    else:
        e_hash_bytes = evidence_hash.ljust(32, b'\0')[:32]

    try:
        # We use transact() since Ganache auto-unlocks the default accounts
        assert contract is not None
        tx_hash = contract.functions.registerViolation(
            v_hash_bytes,
            e_hash_bytes
        ).transact({"from": account})

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Anchored violation {violation_id} to blockchain. Tx: {receipt.transactionHash.hex()}")
        return receipt.transactionHash.hex()
    except Exception as e:
         print(f"Failed to anchor on chain: {e}")
         return None
