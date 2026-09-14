const multer = require("multer");

const ApiError =
    require("../utils/ApiError");

// =====================================================
// STORAGE
// =====================================================

const storage =
    multer.memoryStorage();

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (
    req,
    file,
    cb
) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (
        !allowedMimeTypes.includes(
            file.mimetype
        )
    ) {
        return cb(
            new ApiError(
                400,
                "Only JPG, JPEG, PNG and WEBP images are allowed"
            )
        );
    }

    cb(null, true);
};

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const uploadProductImages =
    multer({
        storage,

        fileFilter,

        limits: {
            fileSize:
                5 * 1024 * 1024,

            files: 10,
        },
    });

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    uploadProductImages,
};