# JK Baking Essentials

## Current State
- Shop named "Bake & Deliver" in Navbar and throughout the app
- HomePage has a "Fresh Baking Essentials" hero tagline and a Delivery Zone section
- Admin page has stock field but no dedicated stock management view
- CheckoutPage has delivery options but no delivery zone info

## Requested Changes (Diff)

### Add
- Delivery zone info section moved to CheckoutPage/payment flow
- Stock management tab or section in AdminPage showing stock levels per product with ability to update

### Modify
- Rename shop from "Bake & Deliver" to "JK Baking Essentials" everywhere (Navbar, page titles, footer, meta)
- Remove the word "Fresh" from HomePage hero tagline
- Remove the Delivery Zone section from HomePage

### Remove
- Delivery Zone section from HomePage
- "Fresh" text from HomePage

## Implementation Plan
1. Replace all instances of "Bake & Deliver" with "JK Baking Essentials" in Navbar, App, and any other files
2. Remove "Fresh" from the HomePage hero text
3. Remove the Delivery Zone `<section>` from HomePage
4. Add delivery zone info card to CheckoutPage above or below the delivery method selector
5. Add a Stock Management tab in AdminPage that lists all products with current stock quantity and an input to update stock per product
