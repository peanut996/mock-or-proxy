const express = require('express')
const axios = require('axios')
let multiparty = require('multiparty');
const dotenv = require('dotenv');
const FormData = require('form-data');
const fs = require("fs");
const tunnel = require('tunnel');
dotenv.config({
    path: `${__dirname}/.env`
});
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var app = express();


const tunnelProxy = tunnel.httpsOverHttp({
    proxy: {
        host: process.env.PROXY_HOST,
        port: process.env.PROXY_PORT,
    },
});

app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Pragma,DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,token,Authorization");
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == 'options')
        res.send(200);
    else
        next();
});


const token = process.env.TOKEN
const baseUrl = process.env.BASE_URL;
const uploadUrl = '/upload';
const profileUrl = '/profile';
app.post(uploadUrl, (req, res) => {
    let form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        let smFile = files.smfile[0];
        let newForm = new FormData();
        newForm.append(smFile.fieldName, fs.createReadStream(smFile.path));

        let smmsHeaders = {
            ...newForm.getHeaders(),
            'Authorization': `Basic ${token}`,
        } 
        let postOption = {
            headers: smmsHeaders
        }
        if (process.env.PROXY){
            postOption.httpsAgent=tunnelProxy;
        }
        axios.post(baseUrl + uploadUrl, newForm, postOption).then((r) => {
            console.log(new Date().toLocaleTimeString()+ ` forward upload status: ${r.data.success}, code: ${r.data.code}`);
            res.send(r.data);
        }).catch((err) => {
            console.debug(err);
            console.log(new Date().toLocaleTimeString()+ ` forward upload failed: errno:${err.errno} errcode:${err.code}`);
            let axiosRes = {
                success: false,
                code: `axios error`
            }
            res.send(axiosRes);
        });
    })
    ;
});

console.log('proxy server on *:9090');
app.listen(9009);
