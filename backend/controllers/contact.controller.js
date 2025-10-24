import User from "../models/user.model.js";
import UserContact from "../models/userContact.model.js";

export const getMyContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const contacts = await UserContact.find({ owner: loggedInUserId })
      .populate('contact', 'mobile username displayName profilePic')
      .sort('savedName');

    const formattedContacts = contacts.map(contactEntry => {
      const contactUser = contactEntry.contact;
      return {
        _id: contactUser._id,
        mobile: contactUser.mobile,
        username: contactUser.username,
        displayName: contactUser.displayName,
        profilePic: contactUser.profilePic,
        savedName: contactEntry.savedName,
      };
    });
    res.status(200).json(formattedContacts);
  } catch (error) {
    console.error("Error in getMyContacts:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const saveContact = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { contactId } = req.params;
    const { savedName } = req.body;

    if (!savedName || savedName.trim() === "") {
      return res.status(400).json({ error: "Saved name cannot be empty." });
    }

    const contactUser = await User.findById(contactId);
    if (!contactUser) {
      return res.status(404).json({ error: "Contact user not found." });
    }

    if (loggedInUserId.toString() === contactId.toString()) {
      return res.status(400).json({ error: "Cannot save yourself as a contact." });
    }

    const existingContact = await UserContact.findOneAndUpdate(
      { owner: loggedInUserId, contact: contactId },
      { savedName: savedName },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Contact saved successfully", contact: existingContact });
  } catch (error) {
    console.error("Error in saveContact:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const searchQuery = req.query.query;

    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({ error: "Search query is required." });
    }

    const matchingUsers = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { mobile: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } },
        { displayName: { $regex: searchQuery, $options: 'i' } }
      ]
    }).select('mobile username displayName profilePic');

    const results = await Promise.all(matchingUsers.map(async (user) => {
      const savedContact = await UserContact.findOne({
        owner: loggedInUserId,
        contact: user._id,
      });

      return {
        _id: user._id,
        mobile: user.mobile,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        displayedName: savedContact ? savedContact.savedName : (user.displayName || user.username || user.mobile),
        isContact: !!savedContact,
      };
    }));
    res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchUsers:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
