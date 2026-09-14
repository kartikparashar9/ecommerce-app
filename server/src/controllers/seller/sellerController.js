const Seller = require("../../models/sellerModel");
const User = require("../../models/userModel");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

const {
  deleteSellerCascade,
} = require("../../services/accountDeletionService");

const {
  sendSellerApprovalEmail,
  sendSellerRejectionEmail,
} = require("../../services/emailService");

// =====================================================
// HELPER
// =====================================================

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// =====================================================
// CREATE SELLER APPLICATION
// =====================================================

const createSeller = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") {
    throw new ApiError(
      403,
      "Admin accounts cannot submit a seller application.",
    );
  }

  const existingSeller = await Seller.findOne({
    user: req.user._id,
  });

  if (existingSeller) {
    throw new ApiError(409, "Seller application already exists.");
  }

  const {
    businessName,
    businessDescription = "",
    businessEmail,
    businessPhone,
    businessType,
    gstNumber = "",
    panNumber,
    address,
    bankDetails,
  } = req.body;

  if (!address) {
    throw new ApiError(400, "Business address is required.");
  }

  if (!bankDetails) {
    throw new ApiError(400, "Bank details are required.");
  }

  const seller = await Seller.create({
    user: req.user._id,

    businessName,
    businessDescription,
    businessEmail,
    businessPhone,
    businessType,
    gstNumber,
    panNumber,

    address: {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      country: address.country || "India",
      postalCode: address.postalCode,
    },

    bankDetails: {
      accountHolderName: bankDetails.accountHolderName,
      accountNumber: bankDetails.accountNumber,
      ifscCode: bankDetails.ifscCode,
      bankName: bankDetails.bankName || "",
    },

    verificationStatus: "pending",
    isActive: true,
    isBlocked: false,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      "Seller application submitted successfully. Please wait for admin approval.",
      seller,
    ),
  );
});

// =====================================================
// GET MY SELLER PROFILE
// =====================================================

const getMySeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({
    user: req.user._id,
  })
    .populate("user", "name email phone avatar role")
    .populate("approvedBy", "name email")
    .populate("blockedBy", "name email");

  if (!seller) {
    throw new ApiError(404, "Seller profile not found.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller profile fetched successfully.",
      seller,
    ),
  );
});

// =====================================================
// UPDATE MY SELLER PROFILE
// =====================================================

const updateMySeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({
    user: req.user._id,
  }).select("+bankDetails.accountNumber");

  if (!seller) {
    throw new ApiError(404, "Seller profile not found.");
  }

  if (seller.isBlocked) {
    throw new ApiError(
      403,
      "Blocked seller accounts cannot update their profile.",
    );
  }

  if (!seller.isActive) {
    throw new ApiError(
      403,
      "Inactive seller accounts cannot update their profile.",
    );
  }

  const {
    businessName,
    businessDescription,
    businessEmail,
    businessPhone,
    businessType,
    gstNumber,
    panNumber,
    address,
    bankDetails,
  } = req.body;

  // =================================================
  // BASIC BUSINESS DETAILS
  // =================================================

  if (businessName !== undefined) {
    seller.businessName = businessName;
  }

  if (businessDescription !== undefined) {
    seller.businessDescription = businessDescription;
  }

  if (businessEmail !== undefined) {
    seller.businessEmail = businessEmail;
  }

  if (businessPhone !== undefined) {
    seller.businessPhone = businessPhone;
  }

  if (businessType !== undefined) {
    seller.businessType = businessType;
  }

  if (gstNumber !== undefined) {
    seller.gstNumber = gstNumber;
  }

  if (panNumber !== undefined) {
    seller.panNumber = panNumber;
  }

  // =================================================
  // ADDRESS UPDATE
  // =================================================

  if (address !== undefined) {
    const currentAddress =
      seller.address && typeof seller.address.toObject === "function"
        ? seller.address.toObject()
        : seller.address || {};

    seller.address = {
      ...currentAddress,
      ...address,
    };
  }

  // =================================================
  // BANK DETAILS UPDATE
  // =================================================

  if (bankDetails !== undefined) {
    const currentBankDetails =
      seller.bankDetails &&
      typeof seller.bankDetails.toObject === "function"
        ? seller.bankDetails.toObject()
        : seller.bankDetails || {};

    seller.bankDetails = {
      ...currentBankDetails,
      ...bankDetails,
    };
  }

  await seller.save();

  // Do not expose account number in response.
  if (seller.bankDetails) {
    seller.bankDetails.accountNumber = undefined;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller profile updated successfully.",
      seller,
    ),
  );
});

// =====================================================
// DELETE MY SELLER PROFILE
// =====================================================

const deleteMySeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({
    user: req.user._id,
  });

  if (!seller) {
    throw new ApiError(404, "Seller profile not found.");
  }

  if (seller.verificationStatus === "approved") {
    throw new ApiError(
      400,
      "Approved seller accounts cannot be deleted directly.",
    );
  }

  await deleteSellerCascade(seller._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller application deleted successfully.",
      null,
    ),
  );
});

// =====================================================
// ADMIN - GET ALL SELLERS
// =====================================================

const getAllSellers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 10, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const {
    status,
    isActive,
    isBlocked,
    search,
  } = req.query;

  const filter = {};

  if (status !== undefined) {
    filter.verificationStatus = status;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (isBlocked !== undefined) {
    filter.isBlocked = isBlocked === "true";
  }

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());

    filter.$or = [
      {
        businessName: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        businessEmail: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        businessPhone: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const [sellers, totalSellers] = await Promise.all([
    Seller.find(filter)
      .populate("user", "name email phone avatar role")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit),

    Seller.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalSellers / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      "Sellers fetched successfully.",
      {
        sellers,
        pagination: {
          totalSellers,
          currentPage: page,
          totalPages,
          limit,
        },
      },
    ),
  );
});

// =====================================================
// ADMIN - GET SELLER BY ID
// =====================================================

const getSellerById = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.sellerId)
    .populate("user", "name email phone avatar role")
    .populate("approvedBy", "name email")
    .populate("blockedBy", "name email");

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller details fetched successfully.",
      seller,
    ),
  );
});

// =====================================================
// ADMIN - APPROVE SELLER
// =====================================================

const approveSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.sellerId).populate(
    "user",
    "name email",
  );

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  if (!seller.user) {
    throw new ApiError(
      404,
      "The user associated with this seller no longer exists.",
    );
  }

  if (seller.verificationStatus !== "pending") {
    throw new ApiError(
      400,
      "Only pending seller applications can be approved.",
    );
  }

  seller.verificationStatus = "approved";
  seller.approvedAt = new Date();
  seller.approvedBy = req.user._id;
  seller.isActive = true;
  seller.isBlocked = false;

  await seller.save();

  // =================================================
  // CHANGE USER ROLE TO SELLER
  // =================================================

  await User.findByIdAndUpdate(
    seller.user._id,
    {
      role: "seller",
    },
    {
      new: true,
    },
  );

  // =================================================
  // SEND APPROVAL EMAIL
  // =================================================

  try {
    await sendSellerApprovalEmail(
      seller.user.email,
      seller.businessName,
    );
  } catch (error) {
    console.error(
      "Seller approval email failed:",
      error.message,
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller approved successfully.",
      seller,
    ),
  );
});

// =====================================================
// ADMIN - REJECT SELLER
// =====================================================

const rejectSeller = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new ApiError(400, "Rejection reason is required.");
  }

  const seller = await Seller.findById(req.params.sellerId).populate(
    "user",
    "name email role",
  );

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  if (!seller.user) {
    throw new ApiError(
      404,
      "The user associated with this seller no longer exists.",
    );
  }

  if (seller.verificationStatus !== "pending") {
    throw new ApiError(
      400,
      "Only pending seller applications can be rejected.",
    );
  }

  // =================================================
  // SEND REJECTION EMAIL
  // =================================================

  try {
    await sendSellerRejectionEmail(
      seller.user.email,
      seller.businessName,
      rejectionReason.trim(),
    );
  } catch (error) {
    console.error(
      "Seller rejection email failed:",
      error.message,
    );
  }

  // =================================================
  // DELETE SELLER APPLICATION
  //
  // IMPORTANT:
  // User account remains.
  // User role remains seller so the same account
  // can submit business details again.
  // =================================================

  await Seller.deleteOne({
    _id: seller._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller application rejected successfully.",
      null,
    ),
  );
});

// =====================================================
// ADMIN - ACTIVATE SELLER
// =====================================================

const activateSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.sellerId);

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  if (seller.verificationStatus !== "approved") {
    throw new ApiError(
      400,
      "Only approved sellers can be activated.",
    );
  }

  if (seller.isBlocked) {
    throw new ApiError(
      400,
      "Blocked sellers must be unblocked before activation.",
    );
  }

  if (seller.isActive) {
    throw new ApiError(
      400,
      "Seller account is already active.",
    );
  }

  seller.isActive = true;

  await seller.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller account activated successfully.",
      seller,
    ),
  );
});

// =====================================================
// ADMIN - DEACTIVATE SELLER
// =====================================================

const deactivateSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.sellerId);

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  if (seller.verificationStatus !== "approved") {
    throw new ApiError(
      400,
      "Only approved sellers can be deactivated.",
    );
  }

  if (!seller.isActive) {
    throw new ApiError(
      400,
      "Seller account is already inactive.",
    );
  }

  seller.isActive = false;

  await seller.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller account deactivated successfully.",
      seller,
    ),
  );
});

// =====================================================
// ADMIN - BLOCK SELLER
// =====================================================

const blockSeller = asyncHandler(async (req, res) => {
  const { blockReason } = req.body;

  if (!blockReason || !blockReason.trim()) {
    throw new ApiError(400, "Block reason is required.");
  }

  const seller = await Seller.findById(req.params.sellerId);

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  if (seller.verificationStatus !== "approved") {
    throw new ApiError(
      400,
      "Only approved sellers can be blocked.",
    );
  }

  if (seller.isBlocked) {
    throw new ApiError(
      400,
      "Seller account is already blocked.",
    );
  }

  seller.isBlocked = true;
  seller.isActive = false;
  seller.blockReason = blockReason.trim();
  seller.blockedAt = new Date();
  seller.blockedBy = req.user._id;

  await seller.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller account blocked successfully.",
      seller,
    ),
  );
});

// =====================================================
// ADMIN - UNBLOCK SELLER
// =====================================================

const unblockSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.sellerId);

  if (!seller) {
    throw new ApiError(404, "Seller not found.");
  }

  if (!seller.isBlocked) {
    throw new ApiError(
      400,
      "Seller account is not blocked.",
    );
  }

  seller.isBlocked = false;
  seller.blockReason = "";
  seller.blockedAt = null;
  seller.blockedBy = null;

  // Seller remains inactive.
  // Admin must explicitly activate it.

  await seller.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      "Seller account unblocked successfully.",
      seller,
    ),
  );
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createSeller,
  getMySeller,
  updateMySeller,
  deleteMySeller,
  getAllSellers,
  getSellerById,
  approveSeller,
  rejectSeller,
  activateSeller,
  deactivateSeller,
  blockSeller,
  unblockSeller,
};