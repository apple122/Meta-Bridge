-- ============================================================
-- ATOMIC BALANCE FIX: REFUND BINARY TRADE
-- Run this in your Supabase SQL Editor to fix balance corruption issues
-- ============================================================

CREATE OR REPLACE FUNCTION refund_binary_trade(
  p_trade_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_trade_amount DECIMAL;
  v_current_status TEXT;
  v_asset_symbol TEXT;
BEGIN
  -- 1. Lock and Check Status
  SELECT user_id, amount, status, asset_symbol 
  INTO v_user_id, v_trade_amount, v_current_status, v_asset_symbol 
  FROM binary_trades WHERE id = p_trade_id FOR UPDATE;
  
  IF v_current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trade already resolved or not pending');
  END IF;

  -- 2. Update Trade Status to Refunded
  UPDATE binary_trades 
  SET status = 'refunded', settled_at = now()
  WHERE id = p_trade_id;

  -- 3. Atomic Balance Refund
  UPDATE profiles 
  SET balance = balance + v_trade_amount 
  WHERE id = v_user_id;

  -- 4. Log Refund Transaction
  INSERT INTO transactions (user_id, type, asset_symbol, amount, price, total, status, binary_trade_id)
  VALUES (v_user_id, 'deposit', v_asset_symbol, 0, 0, v_trade_amount, 'success', p_trade_id);

  RETURN jsonb_build_object('success', true, 'message', 'Trade refunded successfully', 'refunded_amount', v_trade_amount);
END;
$$ LANGUAGE plpgsql;
