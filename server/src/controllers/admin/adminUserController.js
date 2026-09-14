const User = require("../../models/userModel");
const { deleteUserCascade } = require("../../services/accountDeletionService");

const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================

const getAllUsers = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 10,
        search = "",
        role,
        isBlocked,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);

    limit = Math.min(
        Math.max(parseInt(limit) || 10, 1),
        100
    );

    const skip = (page - 1) * limit;

    const query = {};

    if (search && search.trim()) {
        const searchRegex = new RegExp(
            search.trim(),
            "i"
        );

        query.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
        ];
    }

    if (
        role &&
        ["user", "seller", "admin"].includes(role)
    ) {
        query.role = role;
    }

    if (
        isBlocked === "true" ||
        isBlocked === "false"
    ) {
        query.isBlocked =
            isBlocked === "true";
    }

    const [users, totalUsers] =
        await Promise.all([
            User.find(query)
                .select(
                    "-password -googleId -pendingEmail -pendingPhone -resetPasswordToken -resetPasswordExpire -__v"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            User.countDocuments(query),
        ]);

    const totalPages =
        Math.ceil(
            totalUsers / limit
        );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Users fetched successfully",
            {
                users,
                pagination: {
                    totalUsers,
                    currentPage: page,
                    totalPages,
                    limit,
                    hasNextPage:
                        page < totalPages,
                    hasPreviousPage:
                        page > 1,
                },
            }
        )
    );
});

// =====================================================
// GET SINGLE USER
// GET /api/admin/users/:userId
// =====================================================

const getUserById = asyncHandler(
    async (req, res) => {
        const { userId } =
            req.params;

        const user =
            await User.findById(userId)
                .select(
                    "-password -googleId -pendingEmail -pendingPhone -resetPasswordToken -resetPasswordExpire -__v"
                )
                .lean();

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                "User fetched successfully",
                user
            )
        );
    }
);

// =====================================================
// UPDATE USER
// PUT /api/admin/users/:userId
// =====================================================

const updateUser = asyncHandler(
    async (req, res) => {
        const { userId } =
            req.params;

        const adminId =
            req.user._id;

        const user =
            await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }

        if (
            user.role === "admin" &&
            user._id.toString() !==
            adminId.toString()
        ) {
            throw new ApiError(
                403,
                "You cannot modify another admin"
            );
        }

        const allowedFields = [
            "name",
            "email",
            "phone",
            "gender",
            "avatar",
        ];

        allowedFields.forEach(
            (field) => {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    user[field] =
                        req.body[field];
                }
            }
        );

        await user.save();

        const updatedUser =
            await User.findById(
                user._id
            )
                .select(
                    "-password -googleId -pendingEmail -pendingPhone -resetPasswordToken -resetPasswordExpire -__v"
                )
                .lean();

        return res.status(200).json(
            new ApiResponse(
                200,
                "User updated successfully",
                updatedUser
            )
        );
    }
);

// =====================================================
// BLOCK USER
// PATCH /api/admin/users/:userId/block
// =====================================================

const blockUser = asyncHandler(
    async (req, res) => {
        const { userId } =
            req.params;

        const adminId =
            req.user._id;

        const user =
            await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }

        if (
            user._id.toString() ===
            adminId.toString()
        ) {
            throw new ApiError(
                400,
                "You cannot block your own account"
            );
        }

        if (
            user.role === "admin"
        ) {
            throw new ApiError(
                403,
                "Admin accounts cannot be blocked"
            );
        }

        if (user.isBlocked) {
            throw new ApiError(
                400,
                "User is already blocked"
            );
        }

        user.isBlocked = true;

        await user.save({
            validateBeforeSave: false,
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                "User blocked successfully",
                {
                    userId:
                        user._id,
                    isBlocked:
                        user.isBlocked,
                }
            )
        );
    }
);

// =====================================================
// UNBLOCK USER
// PATCH /api/admin/users/:userId/unblock
// =====================================================

const unblockUser = asyncHandler(
    async (req, res) => {
        const { userId } =
            req.params;

        const user =
            await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }

        if (
            user.role === "admin"
        ) {
            throw new ApiError(
                403,
                "Admin accounts cannot be modified"
            );
        }

        if (!user.isBlocked) {
            throw new ApiError(
                400,
                "User is not blocked"
            );
        }

        user.isBlocked = false;

        await user.save({
            validateBeforeSave: false,
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                "User unblocked successfully",
                {
                    userId:
                        user._id,
                    isBlocked:
                        user.isBlocked,
                }
            )
        );
    }
);

// =====================================================
// DELETE USER
// DELETE /api/admin/users/:userId
// =====================================================

const deleteUser = asyncHandler(
    async (req, res) => {
        const { userId } =
            req.params;

        const adminId =
            req.user._id;

        const user =
            await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }

        if (
            user._id.toString() ===
            adminId.toString()
        ) {
            throw new ApiError(
                400,
                "You cannot delete your own admin account"
            );
        }

        if (
            user.role === "admin"
        ) {
            throw new ApiError(
                403,
                "Admin accounts cannot be deleted"
            );
        }

        await deleteUserCascade(userId);

        return res.status(200).json(
            new ApiResponse(
                200,
                "User deleted successfully",
                null
            )
        );
    }
);

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    blockUser,
    unblockUser,
    deleteUser,
};