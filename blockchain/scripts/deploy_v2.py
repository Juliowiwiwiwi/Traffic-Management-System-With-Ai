from web3 import Web3
from eth_account import Account
import json

# Connect to Ganache
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
assert w3.is_connected(), "Ganache not running"


PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
account = Account.from_key(PRIVATE_KEY)

print("Deploying ViolationAuditV2 from:", account.address)

# Load ABI
with open(
    "blockchain/build/blockchain_contracts_ViolationAuditV2_sol_ViolationAuditV2.abi"
) as f:
    abi = json.load(f)

# Load Bytecode
with open(
    "blockchain/build/blockchain_contracts_ViolationAuditV2_sol_ViolationAuditV2.bin"
) as f:
    bytecode = f.read()

# Create contract object
Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

nonce = w3.eth.get_transaction_count(account.address)

tx = Contract.constructor().build_transaction({
    "from": account.address,
    "nonce": nonce,
    "gas": 3_000_000,
    "gasPrice": w3.to_wei("20", "gwei"),
})

signed_tx = account.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

print("Deploy tx hash:", tx_hash.hex())

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("ViolationAuditV2 deployed at:", receipt.contractAddress)
