const express = require("express");
const router = express.Router();

// Index-posts
router.get("/", (req, res) => {
    res.send("GET for posts");
});

// Show-posts
router.get("/:id", (req, res) => {
    res.send("GET for show post ids");
});

// POST-posts
router.post("/", (req, res) => {
    res.send("POST for post ids");
});

// DELETE-posts
router.delete("/:id", (req, res) => {
    res.send("DELETE for post ids");
});

module.exports = router;