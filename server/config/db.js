// meter-tracker/server/config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    // --- NEW DETAILED LOGGING ---
    console.log("-----------------------------------------");
    console.log("DATABASE CONNECTION ATTEMPT");

    if (!mongoURI) {
      console.error("FATAL ERROR: MONGODB_URI environment variable is NOT SET on Render.");
      process.exit(1); // Stop the server if the URI is missing
    }

    // Log a censored version of the URI to check for obvious format errors
    // It replaces the password with '****'
    const censoredURI = mongoURI.replace(/:([^:]+)@/, ':****@');
    console.log(`Attempting to connect with URI: ${censoredURI}`);

    // Set up listeners for connection events BEFORE connecting
    mongoose.connection.on('connecting', () => {
        console.log('Mongoose Status: Connecting...');
    });
    mongoose.connection.on('connected', () => {
        console.log('Mongoose Status: Connection SUCCESSFUL.');
    });
    mongoose.connection.on('error', (err) => {
        // This will catch errors after initial connection
        console.error('Mongoose Status: Connection ERROR after initial connection.', err);
    });
    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose Status: Disconnected.');
    });
    // --- END OF NEW LOGGING ---


    await mongoose.connect(mongoURI);

  } catch (err) {
    // This will catch errors during the initial connect() attempt
    console.error('FATAL ERROR during initial mongoose.connect():', err);
    process.exit(1); // Stop the server on critical connection failure
  }
};

module.exports = connectDB;