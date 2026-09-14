import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/AuthSlice";
import profileReducer from "../features/profile/profileSlice";
import sellerReducer from "../features/seller/sellerSlice";
import productsReducer from "../features/products/ProductSlice";
import cartReducer from "../features/cart/CartSlice";
import ordersReducer from "../features/order/OrderSlice";
import paymentReducer from "../features/payment/PaymentSlice";
import reviewsReducer from "../features/review/ReviewSlice";
import wishlistReducer from "../features/wishlist/WishlistSlice";
import addressesReducer from "../features/address/AddressSlice";
import checkoutReducer from "../features/checkout/CheckoutSlice";
import businessReducer from "../features/bussiness/BussinessSlice";
import brandsReducer from "../features/brands/BrandSlice";
import categoriesReducer from "../features/categories/CategorieSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    seller: sellerReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    payment: paymentReducer,
    reviews: reviewsReducer,
    wishlist: wishlistReducer,
    addresses: addressesReducer,
    checkout: checkoutReducer,
    business: businessReducer,
    brands: brandsReducer,
    categories: categoriesReducer,
  },
});

export default store;
