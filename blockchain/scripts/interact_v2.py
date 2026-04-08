from web3 import Web3
from eth_account import Account
import json

# CONFIG 
RPC_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
PRIVATE_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"  

ABI_PATH = "blockchain/build/blockchain_contracts_ViolationAuditV2_sol_ViolationAuditV2.abi"

#  CONNECT 
w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "❌ Not connected to blockchain"

account = Account.from_key(PRIVATE_KEY)
print("Connected as:", account.address)

#  LOAD ABI 
with open(ABI_PATH) as f:
    abi = json.load(f)

contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=abi
)

print("Contract loaded ")
