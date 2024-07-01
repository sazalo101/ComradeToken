import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";

actor ComradeToken {
    private var totalSupplyVar : Nat = 1_000_000_000; // 1 billion tokens
    private var balances = HashMap.HashMap<Principal, Nat>(1, Principal.equal, Principal.hash);
    private var lastMintTime = HashMap.HashMap<Principal, Int>(1, Principal.equal, Principal.hash);
    private let MINT_AMOUNT : Nat = 100; // Amount of tokens to mint each time
    private let MINT_INTERVAL : Int = 30 * 1_000_000_000; // 30 seconds in nanoseconds

    public shared(msg) func mint() : async Result.Result<Nat, Text> {
        let caller = msg.caller;
        let currentTime = Time.now();
        
        switch (lastMintTime.get(caller)) {
            case (?lastMint) {
                if (currentTime - lastMint < MINT_INTERVAL) {
                    return #err("You can only mint once every 30 seconds");
                };
            };
            case (null) {};
        };
        
        if (totalSupplyVar < MINT_AMOUNT) {
            return #err("Not enough tokens in total supply to mint");
        };
        
        let balance = switch (balances.get(caller)) {
            case (null) { 0 };
            case (?some) { some };
        };
        
        let newBalance = balance + MINT_AMOUNT;
        balances.put(caller, newBalance);
        lastMintTime.put(caller, currentTime);
        totalSupplyVar -= MINT_AMOUNT; // Decrease total supply
        #ok(MINT_AMOUNT)
    };

    public shared(msg) func transfer(to: Principal, amount: Nat) : async Result.Result<(), Text> {
        let from = msg.caller;
        
        let fromBalance = switch (balances.get(from)) {
            case (null) { return #err("Insufficient balance") };
            case (?some) { some };
        };
        
        if (fromBalance < amount) {
            return #err("Insufficient balance");
        };
        
        let toBalance = switch (balances.get(to)) {
            case (null) { 0 };
            case (?some) { some };
        };
        
        balances.put(from, fromBalance - amount);
        balances.put(to, toBalance + amount);
        #ok()
    };

    public query func balanceOf(who: Principal) : async Nat {
        switch (balances.get(who)) {
            case (null) { 0 };
            case (?some) { some };
        }
    };

    public query func getTotalSupply() : async Nat {
        totalSupplyVar
    };

    public query func canMint(who: Principal) : async Bool {
        switch (lastMintTime.get(who)) {
            case (?lastMint) {
                let currentTime = Time.now();
                return (currentTime - lastMint >= MINT_INTERVAL);
            };
            case (null) { true };
        }
    };
};
