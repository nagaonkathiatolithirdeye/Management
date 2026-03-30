const mongoose = require('mongoose')

const connectDB = async (retries = 5, delay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
            })
            console.log("MongoDB Atlas connected")
            return
        } catch (err) {
            console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message)
            if (attempt < retries) {
                console.log(`Retrying in ${delay / 1000}s...`)
                await new Promise(res => setTimeout(res, delay))
            } else {
                console.error("All MongoDB connection attempts failed. Exiting.")
                process.exit(1)
            }
        }
    }
}

module.exports = connectDB
