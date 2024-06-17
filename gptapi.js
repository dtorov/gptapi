// require('dotenv').config()


const path      = require('path');
const Express = require("express");
const app = Express();
const cors = require("cors");
const axios = require('axios');
const mongoose = require('mongoose');
const models = require('./models');

const { host, port, newUserMessage } = require("./config");

const TOKEN = process.env.TOKEN;

const openaiApiKey = 'sk-service-account-1-ALDR7jJoRbMzNB0m0N9wT3BlbkFJo455vWF5rxqV5aSiL1v3';
console.log(process.env.TOKEN)
axios.post(process.env.PROXYADDR + '/openai/init', { token: TOKEN, openaiApiKey})
    .then((resp) => console.log('/openai/init resp.data', resp.data))

app.use(cors());
app.use(Express.static('public'));
app.use(Express.json());

mongoose.connect(`mongodb://${process.env.MONGO_URI}/gptapi`);

app.listen(process.env.PORT || port, process.env.HOST || host, () => {
    console.log("Server Listening on PORT:", port);
});

app.post('/ask', async function (req, res) {
    try {
        const requestData = req.body;


        if(requestData.token !== TOKEN || !requestData.content) throw new Error('server error');
        const context = requestData.context || []; // array of context messages
        const system = requestData.system || []; // array of context messages
        const query = {
            messages: [...system, ...context, { role: 'user', content: requestData.content }],
            model: requestData.model || 'gpt-3.5-turbo',
          }
        console.dir(query, { depth: null , colors: true});
        const reply = await askOpenai(query);
        console.dir(reply, { depth: null , colors: true});
        const conversation = {
            user: requestData.user || {name: 'Dmitry Torov', type: 'web'},
            from: requestData.from || {name: 'Dmitry Torov', type: 'bot'},
            query, reply
        }
        await models.Conversation(conversation).save();
        res.send(reply);
    } catch(err) {
        console.error(err.message)
        res.send({error: true, message: err.message || 'unknown'});
    }

  });

  app.get('/messages', async function (req, res) {
    try {
        const _data = await models.Conversation.find();
        console.log('get messages _data.length: ', _data.length);
        res.send(_data);
    } catch(err) {
        console.error(err.message)
        res.send({error: true, message: err.message || 'unknown'});
    }
  });

  const askOpenai = async function(query) {

    try {
        const openaiProxyReply = await axios.post(process.env.PROXYADDR + '/openai/ask', { token: TOKEN, query});
        console.dir(openaiProxyReply.data, { depth: null , colors: true});
        return openaiProxyReply.data;
    } catch(err) {
        console.error(err);
        return ({error: true});
    }
}