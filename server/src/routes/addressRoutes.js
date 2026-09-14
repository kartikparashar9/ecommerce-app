const express = require("express");

const router = express.Router();

const {
    createAddress,
    getMyAddresses,
    getAddressById,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
} = require("../controllers/addressController");

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    addressLimiter,
} = require("../middleware/rateLimitterMiddleware");

const {
    validateCreateAddress,
    validateUpdateAddress,
    validateAddressId,
} = require("../validator/addressValidator");

router.use(
    authMiddleware,
    addressLimiter
);

router.post(
    "/",
    validateCreateAddress,
    createAddress
);

router.get(
    "/",
    getMyAddresses
);

router.patch(
    "/:addressId/default",
    validateAddressId,
    setDefaultAddress
);

router.patch(
    "/:addressId",
    validateAddressId,
    validateUpdateAddress,
    updateAddress
);

router.delete(
    "/:addressId",
    validateAddressId,
    deleteAddress
);

router.get(
    "/:addressId",
    validateAddressId,
    getAddressById
);

module.exports = router;