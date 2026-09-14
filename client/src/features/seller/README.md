# ShopHub Seller Section

Responsive Seller Center UI + Redux/API integration.

## Included
- Seller protected shell with responsive sidebar/header
- Seller dashboard
- Seller onboarding/setup form
- Pending approval state
- Seller profile
- Seller settings/update profile
- Product management + add/edit/delete/toggle status
- Order management + order detail/status processing
- Analytics page based on seller order/product API data
- Responsive CSS for mobile, tablet, laptop and desktop
- API response normalization for `{ success, statusCode, message, data }`

## Integration
Replace your existing `src/features/seller` folder with this folder.

The existing app should already mount:
`<Route path="/seller/*" element={<SellerRoutes />} />`

The backend Seller controller must use:
`new ApiResponse(statusCode, message, data)`

For example:
`new ApiResponse(200, "Seller profile fetched successfully.", seller)`

## Backend field compatibility
Seller setup sends:
- `businessDescription` (not `description`)
- `address.postalCode` (not `pincode`)
- `bankDetails.accountHolderName`
- `bankDetails.accountNumber`
- `bankDetails.ifscCode`
- `bankDetails.bankName`
