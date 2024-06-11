// require('dotenv').config()

console.log(process.env, process.env.TOKEN)

const Express = require("express");
const app = Express();
const cors = require("cors");
const axios = require('axios');
const mongoose = require('mongoose');
const models = require('./models');

const { host, port, newUserMessage } = require("./config");

const TOKEN = process.env.TOKEN;

app.use(cors());
app.use(Express.json());

mongoose.connect(`mongodb://${process.env.MONGO_URI}/gptapi`);

app.listen(process.env.PORT || port, process.env.HOST || host, () => {
    console.log("Server Listening on PORT:", port);

});

app.post('/ask', async function (req, res) {
    try {
        const requestData = req.body;
        console.dir(requestData, { depth: null , colors: true});

        if(requestData.token !== TOKEN || !requestData.content) throw new Error('server error');

        const query = {
            messages: [{ role: 'user', content: requestData.content }],
            model: requestData.model || 'gpt-3.5-turbo',
          }
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
        const openaiProxyReply = await axios.post(process.env.PROXYADDR + '/ask', { token: TOKEN, query});
        console.dir(openaiProxyReply.data, { depth: null , colors: true});
        return openaiProxyReply.data;
    } catch(err) {
        console.error(err);
        return ({error: true});
    }
}