/*
        *File: app.js
        *Author: Asad Memon / Osman Ali Mian
        *Last Modified: 5th June 2014
        *Revised on: 30th June 2014 (Introduced Express-Brute for Bruteforce protection)
*/




var express = require('express');
var http = require('http');
var arr = require('./compilers');
var sandBox = require('./DockerSandbox');
var bodyParser = require('body-parser');
var app = express();
var server = http.createServer(app);
var port=3000;


var ExpressBrute = require('express-brute');
var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
var bruteforce = new ExpressBrute(store,{
    freeRetries: 50,
    lifetime: 3600
});

var vm_name='laradock_compiler'; //name of virtual machine that we want to execute
var timeout_value=20;//Timeout Value, In Seconds
var windows = 0;
var root_path_code_user = '';
var node_path = "/usr/local/lib/node_modules";

app.use(express.static(__dirname));
app.use(bodyParser());

app.all('*', function(req, res, next) 
{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

function random(size) {
    //returns a crypto-safe random
    return require("crypto").randomBytes(size).toString('hex');
}


app.post('/compile',bruteforce.prevent,function(req, res) 
{

    var language = req.body.language;
    var code = req.body.code;
    var stdin = req.body.stdin;
   
   
    if (!arr.compilerArray[language]) {
        res.send({
            output: '', 
            langid: language, 
            code: code, 
            errors: 'Language invalid', 
            time: 0});
        return;
    }

    if (!code) {
        res.send({
            output: '', 
            langid: language, 
            code: code, 
            errors: 'Code is required', 
            time: 0});
        return;
    }

    var codefile = null;
    var folder= 'temp/' + random(10); //folder in which the temporary folder will be saved
    var path=__dirname+"/"; //current working path

    if (windows == 1) {
        node_path = '"C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules"';
    }
    
    //details of this are present in DockerSandbox.js
    var sandboxType = new sandBox(timeout_value, path, folder, vm_name
        , arr.compilerArray[language][0], arr.compilerArray[language][1], arr.compilerArray[language][2], arr.compilerArray[language][3], arr.compilerArray[language][4]
        ,stdin, code, codefile, root_path_code_user);
        
    //data will contain the output of the compiled/interpreted code
    //the result maybe normal program output, list of error messages or a Timeout error
    sandboxType.run(function(data,exec_time,err)
    {
        console.log('=====================data', data);
        //console.log("Data: received: "+ data)
        res.send({
            output: data, 
            langid: language, 
            code: code, 
            errors: err, 
            time: exec_time});
    }, node_path);
   
});

app.post('/compilecode',bruteforce.prevent,function(req, res) 
{
    var language = req.body.language;
    var codefile = req.body.codefile;
    var stdin = req.body.stdin;
   
    if (!arr.compilerArray[language]) {
        res.send({
            output: '', 
            langid: language, 
            code: codefile, 
            errors: 'Language invalid', 
            time: 0});
        return;
    }

    if (!codefile) {
        res.send({
            output: '', 
            langid: language, 
            code: codefile, 
            errors: 'Codefile is required', 
            time: 0});
        return;
    }

    var code = null;
    var folder= 'temp/' + random(10); //folder in which the temporary folder will be saved
    var path=__dirname+"/"; //current working path
    
    if (windows == 1) {
        node_path = '"C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules"';
    }
    
    //details of this are present in DockerSandbox.js
    var sandboxType = new sandBox(timeout_value, path, folder, vm_name
        , arr.compilerArray[language][0], arr.compilerArray[language][1], arr.compilerArray[language][2], arr.compilerArray[language][3], arr.compilerArray[language][4]
        ,stdin, code, codefile, root_path_code_user);

    //data will contain the output of the compiled/interpreted code
    //the result maybe normal program output, list of error messages or a Timeout error
    sandboxType.run(function(data, exec_time, err)
    {
        console.log('=====================data', data);
        //console.log("Data: received: "+ data)
    	res.send({
            output: data, 
            langid: language, 
            code: '', 
            input: stdin,
            errors: err, 
            time: exec_time
        });
    }, node_path);
   
});

app.post('/compilecodes',bruteforce.prevent,function(req, res) 
{
    var language = req.body.language;
    var codefile = req.body.codefile;
    var stdinArr = JSON.parse(req.body.stdin);

    // return res.send({
    //     stdin: stdinArr,
    //     type: typeof stdinArr
    // });

    if (!arr.compilerArray[language]) {
        res.send({
            output: '', 
            langid: language, 
            code: '', 
            input: stdinArr, 
            errors: 'Language invalid', 
            time: 0});
        return;
    }

    if (!codefile) {
        res.send({
            output: '', 
            langid: language, 
            code: '', 
            input: stdinArr, 
            errors: 'Codefile is required', 
            time: 0});
        return;
    }

    if (typeof stdinArr != typeof []) {
        res.send({
            output: '', 
            langid: language, 
            code: '', 
            input: stdinArr, 
            errors: 'Input data must be array', 
            time: 0});
        return;
    }

    var code = null;
    var folder = 'temp/' + random(10); //folder in which the temporary folder will be saved
    var path =__dirname+"/"; //current working path
    var jsonData = [];

    if (windows == 1) {
        node_path = '"C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules"';
    }

    var index = 0;
    runDockers(res, language, code, codefile, stdinArr, folder, path, 
        node_path,
        index,
        jsonData)
});

function runDockers(response, 
    language, code, codefile, stdinArr, folder, path, 
    node_path,
    index,
    jsonData) {
    
    if (index >= stdinArr.length) {
        return response.send(jsonData);
    }

    var stdin = stdinArr[index];
    //details of this are present in DockerSandbox.js
    var sandboxType = new sandBox(timeout_value, path, folder, vm_name
        , arr.compilerArray[language][0], arr.compilerArray[language][1], arr.compilerArray[language][2], arr.compilerArray[language][3], arr.compilerArray[language][4]
        ,stdin, code, codefile, root_path_code_user);

    //data will contain the output of the compiled/interpreted code
    //the result maybe normal program output, list of error messages or a Timeout error
    sandboxType.run(function(data, exec_time, err)
    {
        console.log("Data: received: ", data);
        
        jsonData.push({
            output: data, 
            langid: language, 
            code: '',
            input: stdin, 
            errors: err, 
            time:exec_time
        });
        
        runDockers(response, language, code, codefile, stdinArr, folder, path, 
            node_path,
            index + 1,
            jsonData)

    }, node_path);
}

app.get('/', function(req, res) 
{
    res.sendfile("./index.html");
});

console.log("Listening at "+port)
server.listen(port);
