module deepbook_agent::inventory_vault;

use sui::event;
use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};

public struct Vault has key, store {
    id: UID,
    owner: address,
    agent: address,
    base_balance: u64,
    quote_balance: u64,
    inventory_position: i64,
    realized_pnl: i64,
    is_killed: bool,
}

public struct InventoryUpdated has copy, drop {
    inventory_position: i64,
    realized_pnl: i64,
    timestamp_ms: u64,
}

public fun create(owner: address, agent: address, ctx: &mut TxContext): Vault {
    Vault {
        id: object::new(ctx),
        owner,
        agent,
        base_balance: 0,
        quote_balance: 0,
        inventory_position: 0,
        realized_pnl: 0,
        is_killed: false,
    }
}

public entry fun deposit_base(vault: &mut Vault, amount: u64, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, 0);
    vault.base_balance = vault.base_balance + amount;
}

public entry fun deposit_quote(vault: &mut Vault, amount: u64, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, 0);
    vault.quote_balance = vault.quote_balance + amount;
}

public entry fun withdraw_base(vault: &mut Vault, amount: u64, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, 0);
    assert!(vault.base_balance >= amount, 1);
    vault.base_balance = vault.base_balance - amount;
}

public entry fun withdraw_quote(vault: &mut Vault, amount: u64, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, 0);
    assert!(vault.quote_balance >= amount, 1);
    vault.quote_balance = vault.quote_balance - amount;
}

public entry fun update_fill(
    vault: &mut Vault,
    inventory_delta: i64,
    realized_delta: i64,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == vault.agent, 0);
    vault.inventory_position = vault.inventory_position + inventory_delta;
    vault.realized_pnl = vault.realized_pnl + realized_delta;
    event::emit(InventoryUpdated {
        inventory_position: vault.inventory_position,
        realized_pnl: vault.realized_pnl,
        timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
    });
}

public entry fun kill_switch(vault: &mut Vault, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == vault.owner, 0);
    vault.is_killed = true;
}
