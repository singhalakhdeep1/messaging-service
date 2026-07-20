const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', chatController.getUserChats);
router.post('/', chatController.createChat);
router.post('/group', chatController.createGroupChat);
router.put('/:id/add', chatController.addToGroup);
router.put('/:id/remove', chatController.removeFromGroup);

module.exports = router;
