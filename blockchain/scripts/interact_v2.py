from web3 import Web3
from eth_account import Account
import json

# CONFIG 
RPC_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = "0x051C742f74Bd5c1278108F2cDa15D4d88Be7721a"
PRIVATE_KEY = "0xe75577de632f5f3dc42cf6f8f3d0aabbfb1d96d226e26c2f005258a4c3a787f1"  

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
