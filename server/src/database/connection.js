const mongoose = require("mongoose");

const connectDB = async () => {

    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        // console.log(`MongoDB Connected: ${conn.connection.host}`);

    } catch (error) {
        console.log("5. Catch Block");
        console.error(error);
    }
};

module.exports = connectDB;