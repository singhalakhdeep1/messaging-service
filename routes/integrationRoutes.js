const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/integrations/webhook:
 *   post:
 *     summary: Generic webhook endpoint for chat events
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;

    console.log(`Webhook received: ${event}`, data);

    switch (event) {
      case 'message.sent':
        await handleMessageSent(data);
        break;
      case 'user.joined':
        await handleUserJoined(data);
        break;
      case 'chat.created':
        await handleChatCreated(data);
        break;
      default:
        console.log('Unknown event type');
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/integrations/slack:
 *   post:
 *     summary: Send message to Slack
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               channel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent to Slack
 */
router.post('/slack', auth, async (req, res) => {
  try {
    const { message, channel } = req.body;
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      return res.status(400).json({ success: false, error: 'Slack webhook URL not configured' });
    }

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, channel: channel || '#general' }),
    });

    if (!response.ok) throw new Error(`Slack request failed: ${response.status}`);

    res.status(200).json({ success: true, message: 'Message sent to Slack' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/integrations/discord:
 *   post:
 *     summary: Send message to Discord
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               webhookUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent to Discord
 */
router.post('/discord', auth, async (req, res) => {
  try {
    const { message, webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: 'Discord webhook URL required' });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) throw new Error(`Discord request failed: ${response.status}`);

    res.status(200).json({ success: true, message: 'Message sent to Discord' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/integrations/telegram:
 *   post:
 *     summary: Send message to Telegram
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               chatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent to Telegram
 */
router.post('/telegram', auth, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramBotToken) {
      return res.status(400).json({ success: false, error: 'Telegram bot token not configured' });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    );

    if (!response.ok) throw new Error(`Telegram request failed: ${response.status}`);

    res.status(200).json({ success: true, message: 'Message sent to Telegram' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/integrations/status:
 *   get:
 *     summary: Get integration status
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const integrations = {
      slack: {
        configured: !!process.env.SLACK_WEBHOOK_URL,
        status: process.env.SLACK_WEBHOOK_URL ? 'active' : 'not configured'
      },
      discord: {
        configured: !!process.env.DISCORD_WEBHOOK_URL,
        status: process.env.DISCORD_WEBHOOK_URL ? 'active' : 'not configured'
      },
      telegram: {
        configured: !!process.env.TELEGRAM_BOT_TOKEN,
        status: process.env.TELEGRAM_BOT_TOKEN ? 'active' : 'not configured'
      }
    };

    res.status(200).json({ success: true, integrations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook handlers
async function handleMessageSent(data) {
  console.log('Message sent webhook:', data.messageId);
}

async function handleUserJoined(data) {
  console.log('User joined webhook:', data.userId);
}

async function handleChatCreated(data) {
  console.log('Chat created webhook:', data.chatId);
}

module.exports = router;
