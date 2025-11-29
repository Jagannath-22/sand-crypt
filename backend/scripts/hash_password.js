import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config(); // Ensure environment variables are loaded if needed

/**
 * Utility to hash a password using bcrypt.
 * Run using: node -r dotenv/config backend/scripts/hash_password.js
 * (You might need to adjust the path and ensure you have bcryptjs installed)
 */
const hashPassword = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter the password to hash: ', async (password) => {
        if (!password) {
            console.error("Password cannot be empty.");
            rl.close();
            return;
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            
            console.log("\n--- PASSWORD HASH GENERATED ---\n");
            console.log("Plain Text Password:", password);
            console.log("BCrypt Hash (Copy this to MongoDB):");
            console.log(hash);
            console.log("\n---------------------------------\n");
            
        } catch (error) {
            console.error("Error generating hash:", error);
        } finally {
            rl.close();
        }
    });
};

hashPassword();
