from web3 import Web3
from eth_account import Account
import json

# Connect to Ganache
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
assert w3.is_connected(), "Not connected to Ganache"


PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
account = Account.from_key(PRIVATE_KEY)
deployer = account.address

print("Deploying from:", deployer)

# Load ABI
with open("blockchain/build/blockchain_contracts_ViolationAudit_sol_ViolationAudit.abi") as f:
    abi = json.load(f)

# Load Bytecode
with open("blockchain/build/blockchain_contracts_ViolationAudit_sol_ViolationAudit.bin") as f:
    bytecode = f.read()

# Create contract
ViolationAudit = w3.eth.contract(abi=abi, bytecode=bytecode)

# Build transaction
nonce = w3.eth.get_transaction_count(deployer)

tx = ViolationAudit.constructor().build_transaction({
    "from": deployer,
    "nonce": nonce,
    "gas": 3000000,
    "gasPrice": w3.to_wei("20", "gwei")
})

# Sign & send
signed_tx = account.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

print("Deploy tx hash:", tx_hash.hex())

# Wait for receipt
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Contract deployed at:", receipt.contractAddress)
