const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.clearCookie('session');
  req.session = null;
  res.status(200).json({ success: true });
});

module.exports = router;
