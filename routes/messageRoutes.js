const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { contentModeration, spamDetection } = require('../middleware/contentModeration');

router.use(protect);

router.get('/search', messageController.searchMessages);
router.get('/:chatId', messageController.getMessages);
router.post('/', spamDetection, contentModeration, messageController.sendMessage);
router.put('/:id', messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);
router.post('/:id/reaction', messageController.addReaction);
router.delete('/:id/reaction', messageController.removeReaction);

module.exports = router;
