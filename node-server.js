const WebSocket = require('ws');
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const express = require('express');
const app = express();
var cors = require('cors');

const name = 'sample_updates' + Date.now();

const connection = mysql.createConnection({
    host: 'localhost',
    user: '****',
    password: '****',
    database: '****'
});

const instance = new MySQLEvents(connection, {
    startAtEnd: true,
    serverId: 1,
    excludedSchemas: {
        mysql: true,
    },
});

const wss = new WebSocket.Server({ port: 8080 });

app.listen('8000', '127.0.0.1', () => {
    console.info(`server started on port 8000`);
});

app.get('/', cors(), function (req, res) {


    connection.query("SELECT * FROM sample", function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

app.get('/:id', cors(), function (req, res) {
    const id = req.params.id;
    console.log(id);
    connection.query("SELECT * FROM sample where id = " + id, function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

function test(event) {
    console.log('in test');
    wss.on('connection', (ws) => {
        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });
        ws.send('Connected');
    });
}



wss.onMessage = function (e) {
    console.log("From Server:" + e.data);
};


const program = async () => {

    instance.start();

    wss.on('connection', (ws) => {
        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });
        // this only works if there is a connectec client!
        instance.removeTrigger({
            name,
            expression: 'itninja.sample.*',
            statement: MySQLEvents.STATEMENTS.ALL,
            onEvent: () => {
                console.log('connection closed');
            }
        });
        instance.addTrigger({
            name,
            expression: 'itninja.sample.*',
            statement: MySQLEvents.STATEMENTS.ALL,
            onEvent: (event) => { // You will receive the events here
                console.log('in add trigger');
                // ws.send(event.affectedRows[0].after);
                ws.send(event.affectedRows[0].after.id);
            }
        });

        instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
        instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);


        ws.send('Connected');
    });

    wss.on('close', (ws) => {

        instance.removeTrigger({
            name,
            expression: 'db.sample.*',
            statement: MySQLEvents.STATEMENTS.ALL,
            onEvent: () => {
                console.log('connection closed');
            }
        });
    })

};



program()
    .then(() => console.log('started'))
    .catch(console.error);
