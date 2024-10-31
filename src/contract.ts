import { NearBindgen, near, call, view, UnorderedMap,assert, UnorderedSet } from 'near-sdk-js';

const balances = new UnorderedMap<string>("balances");
const registeredAccounts = new UnorderedSet<string>("registeredAccounts");
const totalSupplyMap = new UnorderedMap<string>("total_supply"); // New map for total supply



const metadata = {
    name: "Neargami Coin",  // Token name
    symbol: "NGC",            // Token symbol
    decimals: 18,             // Number of decimal places for token
    total_supply: '0',  // Total supply of the token
    icon: 'https://neargami.com/32.png',
    base_uri: null,
    reference: null,
    reference_hash: null,
};

@NearBindgen({})
class NeargamiToken {
    owner: string = '';

    @call({ payableFunction:true }) // Make the function payable
    storage_deposit({ account_id }: { account_id: string }): void {
        const predecessor = account_id || near.predecessorAccountId();
        
        // Assert that the account is not already registered
        assert(!registeredAccounts.contains(predecessor), "Account is already registered.");
        
        // Ensure the amount sent is sufficient
        assert(near.attachedDeposit() >= BigInt("1250000000000000000000"), "Deposit must be at least 0.00125 NEAR");
    
        // Add the account to the registered accounts set
        registeredAccounts.set(predecessor);
        near.log(`Account ${predecessor} registered successfully.`);
    }
    
    

    @call({privateFunction: true})
    init(): void {
        assert(this.owner === '', "Contract is already initialized");
        this.owner = near.predecessorAccountId();
        assert(near.predecessorAccountId() === this.owner, "Only the owner can initialize the contract");
    }

    // Mint function compliant with NEP-141 standard
    @call({})
    ft_mint({ amount }: { receiver_id: string, amount: string }): void {
        // Only the contract owner is allowed to mint new tokens
        assert(near.signerAccountId() === this.owner, "Only the owner can mint tokens");
        assert(amount !== '0', "Mint amount must be greater than zero");
    
        // Convert amount to BigInt and update the total supply
        const mintAmount = BigInt(amount);
        let totalSupply = BigInt(totalSupplyMap.get("total") || "0");
        totalSupply += mintAmount;
        totalSupplyMap.set("total", totalSupply.toString());  // Update total supply
    
        // Update the contract owner's balance
        let ownerBalance = BigInt(balances.get(this.owner) || "0");
        balances.set(this.owner, (ownerBalance + mintAmount).toString());
    
        // Emit ft_mint event for tracking
        near.log(`{"event": "ft_mint", "data": [{"owner_id": "${this.owner}", "amount": "${amount}"}]}`);
    
    }
    
    @call({payableFunction:true})
    ft_transfer({ receiver_id, amount , memo }: { receiver_id: string, amount: string , memo?:string }): void {
        assert(near.signerAccountId() === this.owner, "Only the owner can mint tokens");
        // Ensure the sender has sufficient balance
        const senderId = near.signerAccountId();
        assert(senderId !== receiver_id, "Sender and receiver cannot be the same");
        //assert(registeredAccounts.contains(receiver_id), "Receiver is not registered for storage");

        let senderBalance = BigInt(balances.get(senderId) || "0");
        const transferAmount = BigInt(amount);
        assert(senderBalance >= transferAmount, "Insufficient balance");
    
        // Update sender's and receiver's balances
        senderBalance -= transferAmount;
        balances.set(senderId, senderBalance.toString());
        
        let receiverBalance = BigInt(balances.get(receiver_id) || "0");
        receiverBalance += transferAmount;
        balances.set(receiver_id, receiverBalance.toString());
    
        // Emit ft_transfer event for tracking
        near.log(`{"event": "ft_transfer", "data": [{"sender_id": "${senderId}", "receiver_id": "${receiver_id}", "amount": "${amount}" , "memo": "${memo}"}]}`);
    }
    

    // NEP-141 compliant transfer call with callback functionality
    @call({payableFunction:true})
    ft_transfer_call({ receiver_id, amount, memo }: { receiver_id: string, amount: string, memo: string }): void {
        const sender = near.signerAccountId();
        const transferAmount = BigInt(amount);

        // Ensure sender has enough balance for transfer
        let senderBalance = BigInt(balances.get(sender) || "0");
        assert(senderBalance >= transferAmount, "Insufficient balance");

        // Update sender and receiver balances
        balances.set(sender, (senderBalance - transferAmount).toString());

        let receiverBalance = BigInt(balances.get(receiver_id) || "0");
        balances.set(receiver_id, (receiverBalance + transferAmount).toString());

        // Log the ft_transfer_call event
        near.log(`{"event": "ft_transfer_call", "data": [{"sender_id": "${sender}", "receiver_id": "${receiver_id}", "amount": "${amount}", "msg": "${memo}"}]}`);

        // Initiate the callback function on receiver’s contract with memo
        near.promiseBatchActionFunctionCall(
            near.promiseBatchCreate(receiver_id),
            "on_ft_transfer",
            JSON.stringify({ sender_id: sender, amount, memo }),
            BigInt(0),
            BigInt("500000000000000")  // Equivalent to 20 TGas
        );
    }

    // View function to get the token balance of an account
    @view({})
    ft_balance_of({ account_id }: { account_id: string }): string {
        return balances.get(account_id) || '0';
    }

    // View function to retrieve the metadata for the token
    @view({})
    ft_metadata(): object {
        return metadata;
    }

    @view({})
    get_owner(): string {
        return this.owner;
    }

    @view({})
    ft_total_supply(): string {
        return totalSupplyMap.get("total") || '0';  // Fetch total supply from the map
    }
}
