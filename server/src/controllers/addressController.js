const mongoose = require("mongoose");

const Address = require("../models/addressModel");
const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// CREATE ADDRESS
// =====================================================

const createAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const {
      type = "home",
      name,
      phone,
      addressLine1,
      addressLine2 = "",
      landmark = "",
      city,
      state,
      country = "India",
      postalCode,
      isDefault = false,
    } = req.body;

    // -------------------------------------------------
    // Required fields
    // -------------------------------------------------

    if (!name || typeof name !== "string") {
      return next(new ApiError(400, "Name is required"));
    }

    if (!phone || typeof phone !== "string") {
      return next(new ApiError(400, "Phone is required"));
    }

    if (!addressLine1 || typeof addressLine1 !== "string") {
      return next(new ApiError(400, "Address line 1 is required"));
    }

    if (!city || typeof city !== "string") {
      return next(new ApiError(400, "City is required"));
    }

    if (!state || typeof state !== "string") {
      return next(new ApiError(400, "State is required"));
    }

    if (!postalCode || typeof postalCode !== "string") {
      return next(new ApiError(400, "Postal code is required"));
    }

    // -------------------------------------------------
    // Count User Addresses
    // -------------------------------------------------

    const addressCount = await Address.countDocuments({
      user: userId,
    });

    // -------------------------------------------------
    // First Address = Always Default
    // -------------------------------------------------

    const shouldBeDefault = addressCount === 0 ? true : Boolean(isDefault);

    // -------------------------------------------------
    // Remove Previous Default
    // -------------------------------------------------

    if (shouldBeDefault) {
      await Address.updateMany(
        {
          user: userId,
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );
    }

    // -------------------------------------------------
    // Create
    // -------------------------------------------------

    const address = await Address.create({
      user: userId,

      type: String(type).toLowerCase().trim(),

      name: name.trim(),

      phone: phone.trim(),

      addressLine1: addressLine1.trim(),

      addressLine2: typeof addressLine2 === "string" ? addressLine2.trim() : "",

      landmark: typeof landmark === "string" ? landmark.trim() : "",

      city: city.trim(),

      state: state.trim(),

      country: typeof country === "string" ? country.trim() : "India",

      postalCode: postalCode.trim(),

      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET ALL MY ADDRESSES
// =====================================================

const getMyAddresses = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const addresses = await Address.find({
      user: userId,
    })
      .sort({
        isDefault: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET SINGLE ADDRESS
// =====================================================

const getAddressById = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(addressId)) {
      return next(new ApiError(400, "Invalid address ID"));
    }

    // -------------------------------------------------
    // Ownership Check
    // -------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    }).lean();

    if (!address) {
      return next(new ApiError(404, "Address not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully",
      data: address,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// UPDATE ADDRESS
// =====================================================

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(addressId)) {
      return next(new ApiError(400, "Invalid address ID"));
    }

    // -------------------------------------------------
    // Find User's Address
    // -------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return next(new ApiError(404, "Address not found"));
    }

    const {
      type,
      name,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      country,
      postalCode,
      isDefault,
    } = req.body;

    // -------------------------------------------------
    // Default Handling
    // -------------------------------------------------

    if (isDefault === true) {
      await Address.updateMany(
        {
          user: userId,
          _id: {
            $ne: addressId,
          },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );

      address.isDefault = true;
    }

    // -------------------------------------------------
    // Update Fields
    // -------------------------------------------------

    if (type !== undefined) {
      address.type = String(type).toLowerCase();
    }

    if (name !== undefined) {
      address.name = name.trim();
    }

    if (phone !== undefined) {
      address.phone = phone.trim();
    }

    if (addressLine1 !== undefined) {
      address.addressLine1 = addressLine1.trim();
    }

    if (addressLine2 !== undefined) {
      address.addressLine2 = addressLine2.trim();
    }

    if (landmark !== undefined) {
      address.landmark = landmark.trim();
    }

    if (city !== undefined) {
      address.city = city.trim();
    }

    if (state !== undefined) {
      address.state = state.trim();
    }

    if (country !== undefined) {
      address.country = country.trim();
    }

    if (postalCode !== undefined) {
      address.postalCode = postalCode.trim();
    }

    // -------------------------------------------------
    // Prevent No Default Address
    // -------------------------------------------------

    if (isDefault === false && address.isDefault === true) {
      const otherAddress = await Address.findOne({
        user: userId,
        _id: {
          $ne: addressId,
        },
      }).sort({
        createdAt: -1,
      });

      if (otherAddress) {
        address.isDefault = false;

        otherAddress.isDefault = true;

        await otherAddress.save();
      }
    } else if (isDefault !== undefined) {
      address.isDefault = Boolean(isDefault);
    }

    // -------------------------------------------------
    // Save
    // -------------------------------------------------

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// SET DEFAULT ADDRESS
// =====================================================

const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(addressId)) {
      return next(new ApiError(400, "Invalid address ID"));
    }

    // -------------------------------------------------
    // Find Address
    // -------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return next(new ApiError(404, "Address not found"));
    }

    // -------------------------------------------------
    // Remove Existing Default
    // -------------------------------------------------

    await Address.updateMany(
      {
        user: userId,
        _id: {
          $ne: addressId,
        },
        isDefault: true,
      },
      {
        $set: {
          isDefault: false,
        },
      },
    );

    // -------------------------------------------------
    // Set Default
    // -------------------------------------------------

    address.isDefault = true;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: address,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// DELETE ADDRESS
// =====================================================

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(addressId)) {
      return next(new ApiError(400, "Invalid address ID"));
    }

    // -------------------------------------------------
    // Find Address
    // -------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return next(new ApiError(404, "Address not found"));
    }

    const wasDefault = address.isDefault;

    // -------------------------------------------------
    // Delete
    // -------------------------------------------------

    await Address.deleteOne({
      _id: addressId,
      user: userId,
    });

    // -------------------------------------------------
    // If Default Was Deleted
    // Assign Another Address
    // -------------------------------------------------

    if (wasDefault) {
      const nextDefault = await Address.findOne({
        user: userId,
      }).sort({
        createdAt: -1,
      });

      if (nextDefault) {
        nextDefault.isDefault = true;

        await nextDefault.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
