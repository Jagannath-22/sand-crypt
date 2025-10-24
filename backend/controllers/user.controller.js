import User from "../models/user.model.js";

// Your existing getUsersForSidebar function (no changes)
export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find(
            { _id: { $ne: loggedInUserId } },
            "mobile profilePic"
        ).sort({ mobile: 1 });
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// controllers/user.controller.js



export const searchUserByQuery = async (req, res) => {
    try {
        const { query } = req.query;
        const loggedInUserId = req.user._id;

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const regexQuery = { $regex: query, $options: 'i' };

        const user = await User.findOne({
            $and: [
                { _id: { $ne: loggedInUserId } },
                {
                    $or: [
                        { mobile: regexQuery },
                        { username: regexQuery }
                    ]
                }
            ]
        }).select("mobile profilePic _id username displayName"); // ADD displayName here

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error in searchUserByQuery:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};