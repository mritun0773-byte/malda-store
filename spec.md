# Malda Store

## Current State
- Full grocery delivery app with product browsing, cart, checkout (Stripe, PhonePe, Google Pay, COD)
- Admin panel with product/vendor management, COD toggle
- Orders backend already stores `deliveryAddress` and `status` (pending/confirmed/delivering/delivered/cancelled)
- `updateOrderStatus` API exists for admin
- Checkout page has address field but it may not be prominently displayed
- Orders page shows order list but no status tracking UI
- Admin panel has no order status management section

## Requested Changes (Diff)

### Add
- Delivery address form at checkout: full-width fields for name, address line 1, address line 2 (optional), city, state, PIN code, phone number
- Order tracking view on the Orders page: each order shows a step-by-step status timeline (Pending → Confirmed → Out for Delivery → Delivered)
- Admin panel Orders section: list all orders with customer info, delivery address, items, total, and a dropdown to update order status

### Modify
- CheckoutPage: ensure delivery address is a required, structured form (not just a single text field) before payment
- OrdersPage: add visual status tracker per order (stepper/timeline component)
- AdminPage: add an "Orders" tab showing all orders with status update controls

### Remove
- Nothing removed

## Implementation Plan
1. Update CheckoutPage to show structured delivery address form (name, address1, address2, city, state, pin, phone) collected before payment
2. Pass concatenated address string to createOrder backend call
3. Update OrdersPage to show per-order status timeline stepper
4. Add Orders management tab in AdminPage with status dropdown per order calling updateOrderStatus
