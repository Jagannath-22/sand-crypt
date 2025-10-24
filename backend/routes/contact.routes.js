import express from "express";
import { getMyContacts, saveContact, searchUsers } from "../controllers/contact.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/", protectRoute, getMyContacts);
router.post("/save/:contactId", protectRoute, saveContact);
router.get("/search", protectRoute, searchUsers);

export default router;
