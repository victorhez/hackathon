module deepbook_agent::order_manager;

use sui::event;
use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};

public struct OrderManagerCap has key, store {
    id: UID,
    owner: address,
    agent: address,
}

public struct QuoteRefreshed has copy, drop {
    pool: address,
    bid_count: u64,
    ask_count: u64,
    timestamp_ms: u64,
}

public fun init(owner: address, agent: address, ctx: &mut TxContext): OrderManagerCap {
    OrderManagerCap { id: object::new(ctx), owner, agent }
}

public entry fun refresh_quotes(
    cap: &OrderManagerCap,
    pool: address,
    _old_ids: vector<u64>,
    new_bids: vector<u64>,
    new_asks: vector<u64>,
    _ctx: &mut TxContext
) {
    assert!(tx_context::sender(_ctx) == cap.agent, 0);
    event::emit(QuoteRefreshed {
        pool,
        bid_count: vector::length(&new_bids),
        ask_count: vector::length(&new_asks),
        timestamp_ms: tx_context::epoch_timestamp_ms(_ctx),
    });
}
