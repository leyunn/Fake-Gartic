const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const uuid = require('uuid');

const mongo = require('./mongo');

const app = express();

//get MONGO_URL
require('dotenv-defaults').config();
/* -------------------------------------------------------------------------- */
/*                               MONGOOSE MODELS                              */
/* -------------------------------------------------------------------------- */
const { Schema } = mongoose;
const userSchema = new Schema({
  name: {type: String, require: true},
  color: {type: String},
  score: {type: Number, default: 0},
});
const messageSchema = new Schema({
  roomNumber:{type: Number},
  sender: {type: mongoose.Types.ObjectId, ref: 'User'},
  body: {type: String, require: true},
  correct: {type: Boolean}
})
const problemSchema = new Schema({
  answer: {type: String, require: true},
})


const UserModel = mongoose.model('User', userSchema);
const MessageModel = mongoose.model('Message', messageSchema);
const ProblemModel = mongoose.model('Problem', problemSchema);

/* -------------------------------------------------------------------------- */
/*                            SERVER INITIALIZATION                           */
/* -------------------------------------------------------------------------- */
const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
});

app.use(express.static(path.join(__dirname, 'public')));

let Rooms = {};
const clientRooms = {};
let Answers = {};
let RoomCount = 0
let Rounds = {}
let Correct = {};
let Time = {};
let Drawer = {}
const MAXTIME = 100
const MAXROUND = 10
const validateRoom = ()=>{
  for(var i=0;i<RoomCount;i++){
    if(Rooms[RoomCount].users.length < 10){
      return RoomCount;
    }
  }
  if(!Rooms[RoomCount] || !Rooms[RoomCount].users){
    Rooms[RoomCount] = {};
  }else if(Rooms[RoomCount].users.length >= 10){
    RoomCount++;
    Rooms[RoomCount] = {};
  }
  return RoomCount;
}

wss.on('connection', function connection(client) {
  //console.log("connection");
  client.id = uuid.v4();
  client.roomNumber = undefined
  client.sendEvent = (e)=> {
    // if(e.type!="TIME") console.log("send:",e)
    client.send(JSON.stringify(e))}
  client.on('message', async function incoming(message) {
    message = JSON.parse(message);
    const {type} = message
    // console.log("receive:",type)
    switch(type){
      case 'JOIN':{
        const {
          data:{name, color},
        } = message;
        
        client.name = name
        const newUser = new UserModel({name: name, color: color, score: 0});
        newUser.save();
        client.userid = newUser._id;
        const roomNumber = await validateRoom();
        client.roomNumber = roomNumber
        if(!clientRooms[client.roomNumber]){
          clientRooms[client.roomNumber] = new Set()
        }
        clientRooms[client.roomNumber].forEach((client)=>{
          client.sendEvent({
            type: 'JOIN',
            data:{
              userList: newUser
            }
          })
        })
        if(!Rooms[client.roomNumber].users){
          Rooms[client.roomNumber].users = []
        }
        const messages = await MessageModel.find({roomNumber:client.roomNumber})
        console.log('new user: ',client.userid);
        client.sendEvent({
          type: 'JOINALL',
          data:{
            userList: Rooms[client.roomNumber].users,
            messages,
            id: client.userid
          }
        })
        // client.sendEvent({
        //   type: 'MYID',
        //   data:{
        //     id: 
        //   }
        // })


        Rooms[client.roomNumber].users.push(newUser);
        clientRooms[client.roomNumber].add(client);

        if(clientRooms[client.roomNumber].size === 3 && (isNaN(Rounds[client.roomNumber]) || Rounds[client.roomNumber] == MAXROUND)){
          Rounds[client.roomNumber] = 0;
          let count = 0;
          
          //get problems
          const problem = await ProblemModel.find({});
          const answers = problem.map(n=>n.answer);
          // console.log(answers)
          let arr = [];
          let len = answers.length;
          let anss = []
          if(len > 10){
            for(var i=0;i<10;i++){
              let tmp = Math.floor(Math.random()*len);
              while(arr.includes(tmp)){
                tmp = Math.floor(Math.random()*len);
              }
              arr.push(tmp);
            }
          }else{
            throw new Error('Problem not enough');
          }
          // console.log(arr)
          for(var i=0;i<10;i++){
            anss.push(answers[arr[i]])
          }
          Answers[client.roomNumber] = anss;
          
          //init correct poeple
          Correct[client.roomNumber] = 0;
          
          Drawer[client.roomNumber] = Rooms[client.roomNumber].users[0]
          //set time
          Time[client.roomNumber] = MAXTIME+1;
          clientRooms[client.roomNumber].forEach((client)=>{
            client.sendEvent({
              type:'START',
              data:{
                isdraw: count==0,
                answer:null,
                isround0 : true
              }
            })
            count++;
          })
        }

        break;
      }
      case "ADDPROBLEM":{
        // console.log(message);
        const {data:{answer}} = message;
        const newP = await ProblemModel.findOne({answer})
        // console.log(newP);
        if(newP){client.sendEvent({type: 'ADDPROBLEM',data:{answer:""}})
        }else {
          // console.log("new problem");
          const newProblem = new ProblemModel({answer: answer});
          newProblem.save();
          client.sendEvent({type: 'ADDPROBLEM',data:{answer: answer}})
        }
        break;
      }
      case "GETPROBLEM":{
        // console.log(message);
        const problem = await ProblemModel.find({});
        const answers = problem.map(n=>n.answer);
        client.sendEvent({type: 'GETPROBLEM',data:{answers}})
        break;
      }
      case "GUESS":{
        const {data:{sender, body}} = message;
        
        if(body === Answers[client.roomNumber][Rounds[client.roomNumber]]){
          let score = 10 - Correct[client.roomNumber];
          let drawerscore = 2;
          Correct[client.roomNumber]++;
          if(Correct[client.roomNumber] == 1){
            drawerscore = 11
          }
          if(score < 1){
            score = 1
          }
          
          Rooms[client.roomNumber].users.map((user)=>{
            if(user._id == client.userid){
              user.score += score
            }else if(user._id == Drawer[client.roomNumber]._id){
              user.score += drawerscore
            }
          })

          if(Correct[client.roomNumber] == (Rooms[client.roomNumber].users.length-1)){
            Time[client.roomNumber] = -2;//all ac
          }
          clientRooms[client.roomNumber].forEach((client)=>{
            client.sendEvent({
              type: 'MESSAGE',
              data:{
                sender,
                body: "",
                correct: true,
                score,
                drawerscore
              }
            })
          })
          const newMessage = new MessageModel({roomNumber:client.roomNumber,sender,body, correct: true})
          newMessage.save();
        }else{
          clientRooms[client.roomNumber].forEach((client)=>{
            client.sendEvent({
              type: 'MESSAGE',
              data:{
                sender,
                body,
                correct: false,
                score: 0,
                drawerscore:0
              }
            })
          })
          const newMessage = new MessageModel({roomNumber:client.roomNumber,sender,body, correct: false})
          newMessage.save();
        }
        break;
      }
      case "DRAW":{
        const {data:{x,y,color,type}} = message;
        clientRooms[client.roomNumber].forEach((client)=>{
          client.sendEvent({
            type:'DRAW',
            data:{
              x,
              y,
              color,
              type
            }
          })
        })
        break;
      }
      // start a round
      case 'START':{
        //start draw for [round]th client
        console.log('start')
        //init correct poeple
        Correct[client.roomNumber] = 0;
        
        //assign drawer
        let count = 0;
        let drawerNum;
        let drawer;
        if(Rooms[client.roomNumber] != undefined){
          drawerNum = Rounds[client.roomNumber]%Rooms[client.roomNumber].users.length;
          drawer = Rooms[client.roomNumber].users[drawerNum]
        }
        Drawer[client.roomNumber] = drawer
        let answer = Answers[client.roomNumber][Rounds[client.roomNumber]]
        clientRooms[client.roomNumber].forEach((client)=>{
          if(count === drawerNum){
            client.sendEvent({
              type:'ROUNDSTART',
              data:{
                answer
              }
            })
          }else{
            client.sendEvent({
              type:'ROUNDSTART',
              data:{
                drawer
              }
            })
          }
          count++;
        })
        
        //set time
        Time[client.roomNumber] = MAXTIME;
        
        let countdown = setInterval(async()=>{
          if(Time[client.roomNumber] > 0){
            Time[client.roomNumber]--;
            if(clientRooms[client.roomNumber]!= undefined){
              clientRooms[client.roomNumber].forEach((client)=>{
                client.sendEvent({
                    type:'TIME',
                    data:{
                      time:Time[client.roomNumber]
                    }
                })
              })
            }
          }else{
            clearInterval(countdown);
            /************* *end* **************/
            // console.log('Round '+Rounds[client.roomNumber]+' end')
            if((Rounds[client.roomNumber]+1) == MAXROUND){
              let winners = [];
              Rounds[client.roomNumber]++;
              let winner = Rooms[client.roomNumber].users[0];
              for(var i=1;i<Rooms[client.roomNumber].users.length;i++){
                if(winner.score < Rooms[client.roomNumber].users[i].score){
                  winner = Rooms[client.roomNumber].users[i];
                }
              }
              for(var i=0;i<Rooms[client.roomNumber].users.length;i++){
                if(winner.score == Rooms[client.roomNumber].users[i].score){
                  winners.push(Rooms[client.roomNumber].users[i]);
                }
              }
              clientRooms[client.roomNumber].forEach((client)=>{
                client.sendEvent({
                  type: 'WINNER',
                  data:{
                    winners
                  }
                })
              })
              Rooms[client.roomNumber].users.map(async(user)=>{
                await UserModel.deleteOne({user})
              })
              Rooms[client.roomNumber].users = [];
              let num =client.roomNumber;
              await MessageModel.deleteMany({roomNumber:client.roomNumber})
              clientRooms[client.roomNumber].forEach((client)=>{
                client.roomNumber = undefined
              })
              clientRooms[num] = undefined;
            /************* *end* **************/
              //break;  
            }else{
              let type = 'TimesUp';
              if(Time[client.roomNumber] == -2){
                type = 'AllAC'
              }else if(Time[client.roomNumber] == -3){
                type = 'DrawerLeft'
              }
              let drawerNum;
              if(Rooms[client.roomNumber] != undefined){
                drawerNum = (Rounds[client.roomNumber]+1)%Rooms[client.roomNumber].users.length;
                Drawer[client.roomNumber] = Rooms[client.roomNumber].users[drawerNum]
              }
              //set time
              Time[client.roomNumber] = MAXTIME+1;
              let count = 0; 
              if(clientRooms[client.roomNumber] != undefined){

                clientRooms[client.roomNumber].forEach((client)=>{
                  client.sendEvent({
                    type: 'START',
                    data:{
                      isdraw: count==drawerNum,
                      answer: Answers[client.roomNumber][Rounds[client.roomNumber]],
                      isround0 : false,
                      type
                    }
                  })
                  count++;
                })
              }
              //delete old message
              await MessageModel.deleteMany({roomNumber:client.roomNumber})
              Rounds[client.roomNumber]++;
            }
          }
        },1000);
        // console.log('start  Round:' + Rounds[client.roomNumber])
        // console.log('answer:')
        // console.log(answer)
        break;
      }
    }
    // disconnected
  });

  client.once('close',() => {
    //console.log("a client closing");
    if(client.roomNumber !== undefined){
      if(clientRooms[client.roomNumber] !== undefined){
        clientRooms[client.roomNumber].delete(client);
      }
      Rooms[client.roomNumber].users = Rooms[client.roomNumber].users.filter((user)=> {
        return user._id !== client.userid
      })
      let id = client.userid;
      // console.log("someone left",id)
      // console.log(Drawer[client.roomNumber]._id)
      if(Drawer[client.roomNumber] && id == Drawer[client.roomNumber]._id){
        //re-find drawer
        if(clientRooms[client.roomNumber] !== undefined && clientRooms[client.roomNumber].size != 1 && (Time[client.roomNumber] == MAXTIME+1||Time[client.roomNumber] == -3) ){
          let drawerNum;
          // console.log(Rooms[client.roomNumber].users.length)
          if(Rooms[client.roomNumber] != undefined){
            Rounds[client.roomNumber]+=1
            drawerNum = Rounds[client.roomNumber]%Rooms[client.roomNumber].users.length;
          }
          // console.log(Rooms[client.roomNumber].users[drawerNum])
          Drawer[client.roomNumber] =  Rooms[client.roomNumber].users[drawerNum]
          let count = 0; 
          if(clientRooms[client.roomNumber] != undefined){
            clientRooms[client.roomNumber].forEach((client)=>{
              if(count==drawerNum) console.log("send start to drawer", client.userid)
              client.sendEvent({
                type: 'START',
                data:{
                  isdraw: count==drawerNum,
                  answer: Answers[client.roomNumber][Rounds[client.roomNumber]],
                  isround0 : false,
                  type: 'DrawerLeft'
                }
              })
              count++;
            })
          }
        }
        Time[client.roomNumber] = -3;
}
      if(clientRooms[client.roomNumber] !== undefined){
        clientRooms[client.roomNumber].forEach((client)=>{
          client.sendEvent({
            type: 'LEAVE',
            data:{
              id
            }
          })
        })
      }
      if(clientRooms[client.roomNumber] !== undefined && clientRooms[client.roomNumber].size == 1 && !(isNaN(Rounds[client.roomNumber]) || Rounds[client.roomNumber] == MAXROUND)){
        Rounds[client.roomNumber] = undefined;
        clientRooms[client.roomNumber].forEach((client)=>{
          client.sendEvent({
            type: 'KICK',
            data:{
            }
          })
          client.roomNumber = undefined;
        })
        Rooms[client.roomNumber].users.map(async(user)=>{
          await UserModel.deleteOne({user})
        })
        Rooms[client.roomNumber].users = [];
        clientRooms[client.roomNumber] = undefined;
      }
    
      UserModel.deleteOne({_id:id});
    }
  });
  
});




mongo.connect();

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server listening at ${process.env.PORT || 8080}`);
});