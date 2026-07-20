const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get chat analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Message statistics
    const totalMessages = await Message.countDocuments({ sender: userId });
    const messagesReceived = await Message.countDocuments({ 
      chat: { $in: await Chat.find({ participants: userId }).distinct('_id') }
    });

    // Chat statistics
    const totalChats = await Chat.countDocuments({ participants: userId });
    const activeChats = await Chat.countDocuments({ 
      participants: userId,
      lastMessageAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Messages over time (last 30 days)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const messages = await Message.countDocuments({
        sender: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      last30Days.push({
        date: startOfDay.toISOString().split('T')[0],
        messages
      });
    }

    // Most active chats
    const activeChatsList = await Chat.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .populate('participants', 'name avatar status');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMessages,
          messagesReceived,
          totalChats,
          activeChats
        },
        messagesOverTime: last30Days,
        topChats: activeChatsList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/engagement:
 *   get:
 *     summary: Get user engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engagement metrics retrieved
 */
router.get('/engagement', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Average messages per day
    const user = await User.findById(userId);
    const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)));
    const totalMessages = await Message.countDocuments({ sender: userId });
    const avgMessagesPerDay = (totalMessages / daysSinceCreation).toFixed(2);

    // Peak activity hours
    const messageHours = await Message.aggregate([
      { $match: { sender: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Response time (average time between receiving and responding)
    const responseTimes = await Message.aggregate([
      { $match: { sender: mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$chat', createdAt: '$createdAt' },
          pipeline: [
            { $match: {
              $expr: {
                $and: [
                  { $eq: ['$chat', '$$chatId'] },
                  { $lt: ['$createdAt', '$$createdAt'] }
                ]
              }
            }},
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'prevMessage'
        }
      },
      { $unwind: '$prevMessage' },
      {
        $project: {
          responseTime: { $subtract: ['$createdAt', '$prevMessage.createdAt'] }
        }
      }
    ]);

    const avgResponseTime = responseTimes.length > 0 
      ? (responseTimes.reduce((sum, item) => sum + item.responseTime, 0) / responseTimes.length / 1000 / 60).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        avgMessagesPerDay,
        peakHours: messageHours,
        avgResponseTime: `${avgResponseTime} minutes`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
