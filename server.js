var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

var connections = 0;
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

// get database url from mlab
var mlaburl = 'mongodb://usertest:0jsj0jsj0@ds159129.mlab.com:59129/chat_app'
// create a custom design database model using mongoose
var MsgModel = mongoose.model('MessageCollection',{
  name: String,
  message : String
});

app.get('/messages',(req,res)=>{
  // from model created get ALL data denoted by "{}" and pass to 2nd param
      MsgModel.find({},(err, texts)=>{
      console.log("found messages");
      res.send(texts); // send back the all data to response
  })
})

app.post('/messages',(req,res)=>{
  // create an instance of MsgModel and past in the body from post request
  var message = new MsgModel(req.body);
  // save it in the database
  message.save((err)=>{
      if(err){
        sendStatus(500); // 500 is server err
      }
      io.emit('msg',req.body); // if no error saving send out signal for msg
      // "msg" signal will trigger getMessages
      res.sendStatus(200);
  })
})

process.on('exit', function () {
  console.log('exiting');
});
process.on('SIGINT', function(){
  handleExit();

});

// check connection
io.on("connection",(socket)=>{
    connections++;
    console.log(`${connections}(s) people connected`);
    socket.on('disconnect', function () {
      connections--;
      console.log("disconnected");
      if (connections == 0 ){
          console.log("No more connections");
          handleExit();
        }

      })

      });
//connect to moongoose to specific database
mongoose.connect(mlaburl,{ useNewUrlParser: true},(err)=>{
    console.log(`mongodb connection with error msg: ${err} `);
})
var handleExit = ()=>{
  MsgModel.remove({},(err)=>{
  console.log("deleting messages");
  process.exit();
})
}
var server = http.listen(3000, () => {
  console.log("server is listening on port ",server.address().port)
});
