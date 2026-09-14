const mongoose = require("mongoose");

const connectDB = async () => {

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

    } catch (error) {
        console.log("5. Catch Block");
        console.error(error);
    }
};

module.exports = connectDB;