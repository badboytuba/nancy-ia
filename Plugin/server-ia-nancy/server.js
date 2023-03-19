const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });
const axios = require('axios');
const { WebClient } = require('@slack/web-api');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

const slackClient = new WebClient(SLACK_BOT_TOKEN);

const client = new MongoClient(MONGO_URI);
const dbName = 'ia_nancy';
const collectionName = 'conversations-ia-nancy';

const userMessages = {};

async function checkMongoConnection(client) {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.log(`Error connecting to MongoDB: ${error}`);
    return false;
  }
}

(async () => {
  const connected = await checkMongoConnection(client);
  if (!connected) {
    console.log('Exiting due to MongoDB connection error.');
    process.exit(1);
  }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  const { channel_id, user_id, text } = req.body;

  if (!userMessages[user_id]) {
    userMessages[user_id] = [];
  }

  userMessages[user_id].push({ role: 'user', content: text });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/engines/davinci-codex/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: userMessages[user_id],
        temperature: 0.7,
        timeout: 600,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const messageContent = response.data.choices[0].message.content.replace('OpenAI', 'BADER');

    userMessages[user_id].push({ role: 'assistant', content: messageContent });

    const userInfo = await slackClient.users.info({ user: user_id });
    const username = userInfo.user.profile.display_name_normalized;

    const conversationData = {
      user_id,
      username,
      app: 'slack',
      question: text,
      answer: messageContent,
      timestamp: new Date(),
    };

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.insertOne(conversationData);

    await slackClient.chat.postMessage({
      channel: channel_id,
      text: `<@${user_id}>: ${messageContent}`,
    });

    res.send(`Sua pergunta *${text}* está sendo processada. Em breve, você receberá uma resposta no Slack.`);
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

io.on('connection', (socket) => {
  socket.on('message', async (data) => {
    const user_id = socket.id;
    const { content, username } = data;

    if (!userMessages[user_id]) {
        userMessages[user_id] = [];
      }
  
      userMessages[user_id].push({ role: 'user', content, username });
  
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/engines/davinci-codex/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: userMessages[user_id],
            temperature: 0.7,
            timeout: 600,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
          }
        );
  
        const messageContent = response.data.choices[0].message.content.replace('OpenAI', 'BADER');
  
        userMessages[user_id].push({ role: 'assistant', content: messageContent });
  
        const conversationData = {
          user_id,
          username,
          app: 'site',
          question: content,
          answer: messageContent,
          timestamp: new Date(),
        };
  
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.insertOne(conversationData);
  
        socket.emit('message_response', { content: messageContent });
      } catch (error) {
        console.error(`Error: ${error}`);
      }
    });
  });
  
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '167.99.200.88';
  
  server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
