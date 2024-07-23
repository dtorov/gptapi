// require('dotenv').config()


const path      = require('path');
const Express = require("express");
const app = Express();
const cors = require("cors");
const axios = require('axios');
const mongoose = require('mongoose');
const CronJob   = require('cron').CronJob;

const models = require('./models');

const { host, port, newUserMessage } = require("./config");

const TOKEN = process.env.TOKEN;

console.log(process.env)



/*
const openaiApiKey = 'sk-service-account-1-ALDR7jJoRbMzNB0m0N9wT3BlbkFJo455vWF5rxqV5aSiL1v3';
console.log(process.env.TOKEN)
axios.post(process.env.PROXYADDR + '/openai/init', { token: TOKEN, openaiApiKey})
    .then((resp) => console.log('/openai/init resp.data', resp.data))
*/

app.use(cors());
app.use(Express.static('public'));
app.use(Express.json());

mongoose.connect(`mongodb://${process.env.MONGO_URI}/gptapi`);

app.listen(process.env.PORT || port, process.env.HOST || host, () => {
    console.log(moment().format('YYYY/MM/DD HH:mm:ss') + ": Server Listening on PORT:", port);
});

const start = function () {
  const _sett = {
    yagpt: {
        IAM_TOKEN: 't1.9euelZrOlZmWzIyQyonKlpDMnJOeku3rnpWay8qJj8iKkc6ckYublJOQksrl8_cbGAVL-e8Za3g-_t3z91tGAkv57xlreD7-zef1656VmsmWyZCczIuZmZDNjZGaipeb7_zF656VmsmWyZCczIuZmZDNjZGaipeb.xfMrpFrHzgwBb__W8KlRxqP9H_4dJLmABo_LAkCM0OVMHkSXwlO5aGXI3FhX9KNmVW37D3g1Wm7IoTRdP0CVAw',
        FOLDER_ID: 'b1gve32i3o5e0f76tk5p',
        model: 'yandexgpt-lite',
        completionOptions: {
            stream: false,
            temperature: 0.6,
            maxTokens: 2000
        },
        defaultModel: 'yandexgpt-lite',
        apiURL: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
    }
  }
  models.SystemSettings(_sett).save();
}


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

app.post('/yagpt/v1/chat/completions', async function (req, res) {
    try {
        const _request = req.body;
        /*
            requestData = {
                client: '', // telegram, maker, web
                user_id: '', id
                user: {},
                system: [],
                context: [],
                content: '',
                model: '',
                token: '',
                completionOptions: {}
            }
        */

        let _user = await models.User.findOne({[`${_request.id}`]: _request.user_id});
        if(!_user) {
            _user = await models.User(_request.user).save();
        }
        const _settings = await models.SystemSettings.findOne({});

        console.log(_user, _settings)

        if(_request.token !== TOKEN || !_request.client || !_request.user_id) throw new Error('server error');
        const context = _request.context || _user.context || []; // array of context messages
        const system = _request.system || (_user.role.content ? [{ role: 'system', text: _user.role.content}] : []) ; // array of context messages
        const query = {
            modelUri: `gpt://${_settings.yagpt.FOLDER_ID}/${_request.model || _settings.yagpt.defaultModel}`,
            completionOptions: _request.completionOptions || _settings.yagpt.completionOptions,
            messages: [...system, ...context, { role: 'user', text: _request.content }]
          }
        console.dir(query, { depth: null , colors: true});
        const reply = await askYaGpt(query, _settings.yagpt);
        console.dir(reply, { depth: null , colors: true});
        const conversation = {
            user: _request.user || {name: 'Dmitry Torov', type: 'web'},
            from: _request.from || {name: 'Dmitry Torov', type: 'bot'},
            query, reply
        }
        await models.Conversation(conversation).save();
        res.send(reply);
    } catch(err) {
        console.error(err.message)
        res.send({error: true, message: err.message || 'server auth error'});
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

  const askYaGpt = async function(query, settings) {
    try {
        const config = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${settings.IAM_TOKEN}`,
                "x-folder-id": `${settings.FOLDER_ID}`
            }
        }
        const yaGptReply = await axios.post(settings.apiURL, query, config);
        console.dir(yaGptReply.data, { depth: null , colors: true});
        return yaGptReply.data;
    } catch(err) {
        console.error(err);
        return ({error: true});
    }
  }

  const updateYaGptToken = new CronJob('15 * * * * *', async function() {
    console.log(moment().format('YYYY/MM/DD HH:mm:ss') + ' renew Authorization');

    const _settings = await models.SystemSettings.findOne({});
    const _new_IAM_TOKEN = await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', { "yandexPassportOauthToken": _settings.OAuth_token });

    console.dir(_new_IAM_TOKEN.data, { depth: null , colors: true});



  }, function () {
    console.log(moment().format('YYYY/MM/DD HH:mm:ss') + ' renew Authorization stop');
  },
  true,
  'Europe/Moscow'
);