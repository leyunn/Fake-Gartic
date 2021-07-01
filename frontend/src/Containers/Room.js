import '../App.css';
import Canvas from '../Components/Canvas';
import { useState, useEffect, useRef } from "react";
import UserList from '../Components/UserList';
import {Input, Progress} from "antd";
import useGame from "../Hooks/useGame";
import Waiting from './Waiting';
import CanvasView from '../Components/CanvasView';
const Room = ({me, info, displayStatus, setMe, setStart})=>{ 
    const [users, setusers] = useState([me]); 
    const [usernum, setusernum] = useState(1);
    const {status, confirmRoundStart, guessWord, sendDraw, joinRoom} = useGame({displayStatus});
    const [gamestart, setgamestart] = useState(false);
    const [displayTitle, setdisplayTitle] = useState("Gartic");
    const [displayText, setdisplayText] = useState("made by Alex and Leyun");
    const [isdrawing, setisdrawing] = useState(false);
    const [isdrawer, setisdrawer] = useState(false);
    const [canGuess, setcanGuess] = useState(false);
    const [roundTime, setroundTime] = useState(100);
    const [messages, setmessages] = useState([]);
    const [drawing, setdrawing] = useState(false);
    const [word, setword] = useState("none");
    const [guessinput, setguessinput] = useState("");
    const [progcolor, setprogcolor] = useState("#5dcc26");
    const messagesEndRef = useRef(null);
    const [stroke, setstroke] = useState({});
    const [drawer, setdrawer] = useState("");

    const scrollToBottom = async () => {
      await messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  };

    const beforeRoundStart=(data)=>{
      console.log(data)
      if(data.isround0){
        setdisplayTitle("Game is about to start!");
        setdisplayText(`You are ${(data.isdraw)?"drawing":"guessing"}`)
      }else if(data.type=="TimesUp"){
        setdisplayTitle(`The answer of last round is ${data.answer}!`);
        setdisplayText(`You are ${(data.isdraw)?"drawing":"guessing"} in next round.`)
      }else if(data.type=="AllAC"){
        setdisplayTitle(`Everybody hit the answer!`);
        setdisplayText(`You are ${(data.isdraw)?"drawing":"guessing"} in next round.`)
      }if(data.type=="DrawerLeft"){
        setdisplayTitle(`Drawer disconnected...`);
        setdisplayText(`You are ${(data.isdraw)?"drawing":"guessing"} in next round.`)
      }
      if(data.isdraw){
        setisdrawer(true);
        let timer = setTimeout(() => {
          confirmRoundStart();
        }, 6000);
        return () => {
          clearTimeout(timer);
        };
      }else{
        setisdrawer(false)
      }
    }


    useEffect(() => {
      if(status.type == "START"){ //{type:"START"}
        console.log(status.data)
        beforeRoundStart(status.data);
        setgamestart(true);
        setcanGuess(false);
        setdrawing(false);
        setisdrawing(false)
        setusers(users.map(n=>{
          let a = n;
          a.draw = false;
          a.correct = false;
          return a;
        }))
      }
      if(status.type == "ROUNDSTART"){ 
        console.log(status.data)
        // setroundStart(performance.now());
        if(isdrawer){
          setdrawer(me._id)
          setusers(users.map(n=>{
            let a = n;
            if(a.me==true) a.draw=true;
            return a;
          }))
          setword(status.data.answer);
          setisdrawing(true);
          setdrawing(true);
        // confirmRoundStart();
        return () => {
        }
      }else{
        setdrawer(status.data.drawer._id)
        setusers(users.map(n=>{
          let a = n;
          if(a._id==status.data.drawer._id) a.draw=true;
          return a;
        }))
          setcanGuess(true);
          setdrawing(true);
        }
      }
      // if(status.type == "MYID"){
      //   me._id = status.data.id;
      // }
      if(status.type == "JOIN"){ 
        setusers([...users, {name: status.data.userList.name, me: false, draw:false, score: status.data.userList.score, color: status.data.userList.color, _id: status.data.userList._id}])
      }
      if(status.type == "LEAVE"){ 
        setusers(users.filter(n=>n._id !== status.data.id))
      }
      if(status.type == "WINNER"){
        console.log("winner",status.data);
        if(status.data.winners.length>1){
          let str = "The winners are" 
          status.data.winners.forEach(n => {
            str = str.concat(" ", n.name)
          });
          str = str.concat(" ", "!");
          setdisplayTitle(str);
        }else{
          setdisplayTitle(`The winner is ${status.data.winners[0].name}`);
        }
        if(status.data.winners.find(n=>n._id==me._id)){
          setdisplayText("Well done!")
        }else setdisplayText("It's ok! You got it next time!")
          setisdrawer(false);
          setisdrawing(false);
          setcanGuess(false);
          setdrawing(false);
        let timer = setTimeout(() => {
          //kick you out
          setdisplayTitle("Gartic");
          setdisplayText("made by Alex and Leyun");
          setroundTime(100);
          setmessages([]);
          setword("");
          setguessinput("");
          setusernum(1);
          let newme = me;
          newme.draw = false;
          newme.correct = false;
          setMe(newme)
          // let newme = me;
          // newme.draw = false;
          // newme._id = "";
          // setMe(newme);
          // setgamestart(false);
          // setusers([newme]);
          // joinRoom(newme);
          setgamestart(false);
          setStart(false);
        }, 6000);
        return () => {
          clearTimeout(timer);
        };
      }
      if(status.type == "DRAW"){
        setstroke(status.data);
      }
      if(status.type == "KICK"){
        setdisplayTitle(`Everyone else disconnected...`);
        setdisplayText(`please go to another room...`);
        setisdrawer(false);
          setisdrawing(false);
          setcanGuess(false);
          setdrawing(false);
          let timer = setTimeout(() => {
            //kick you out

            setdisplayTitle("Gartic");
            setdisplayText("made by Alex and Leyun");
            setroundTime(100);
            setmessages([]);
            setword("");
            setguessinput("");
            setgamestart(false);
            setusernum(1);
            let newme = me;
            newme.draw = false;
            setMe(newme)
            // let newme = me;
            // newme.draw = false;
            // setMe(newme);
            // setusers([newme]);
            // joinRoom(newme);
            setStart(false);
          }, 6000);
      }
      if(status.type == "TIME"){
        setroundTime(status.data.time);
        if (status.data.time==0&&isdrawer) {setisdrawing(false)}
      }
    if(status.type == "MESSAGE"){
        setusers(users.map((n=>{
          let a = n;
          if(a._id==status.data.sender && status.data.correct) a.correct=true;
          if(a._id==status.data.sender) a.score+=status.data.score;
          else if(a._id==drawer) a.score+=status.data.drawerscore;
          return a;
        })))
        let m = status.data;
        let sender = users.find(n=>n._id==m.sender);
        if(m.sender==me._id&& m.correct) setcanGuess(false) 
        m.sender=sender;
        setmessages([...messages, m])
      }
      
    }, [status])

    useEffect(() => {
      // setmessages(info.messages)
      setusers([me,...info.userList.map(n=>{
        let a = n;
        a.me = false;
        a.draw = false;
        return a;
      })])
    }, [info])

    useEffect(() => {
      if(roundTime>=40) {
        if(progcolor!= "#5dcc26") setprogcolor("#5dcc26")

      }else if(roundTime>=20){
        if(progcolor!= "#f3d528") setprogcolor("#f3d528")}
      else if(progcolor!= "#f65228") setprogcolor("#f65228")
    }, [roundTime])

    useEffect(() => setusernum(users.length), [users])
    useEffect(() => {
      scrollToBottom();
    }, [messages])
    return(

        <div className="PlayScreen">
        <div className="UserList-view"><UserList users={users}/></div>
        <div className="CanvasAndChat-view">
          {(isdrawing)? <Canvas sendDraw={sendDraw}/>: (!drawing)?<div className="Display"> 
          <>
          <span className="displayTitle">{displayTitle}</span>
          <p className="displayText">{displayText}</p>
          </>
          </div>:<CanvasView  data={stroke}/>}
          <Waiting num={usernum} visible={!gamestart} />
          <div className = "Chat">
            <div className="chatleft">
            <div className="Chat-messages">{messages.map((n,i)=>(
              (i!=messages.length-1)?(
              (n.correct)? 
              <p className="correctFont">{(n.sender._id==me._id)?'You hit the answer!':`${n.sender.name} hits the answer!`}</p>
              :<p className="guessFont">{n.sender.name}: {n.body}</p>):(
                (n.correct)? 
              <p className="correctFont" ref={messagesEndRef} >{(n.sender._id==me._id)?'You hit the answer!':`${n.sender.name} hit the answer!`}</p>
              :<p className="guessFont" ref={messagesEndRef} >{n.sender.name}: {n.body}</p>
              )
        ))}</div>
            <Input.Search autoFocus={true} onChange={(e) => 
          setguessinput(e.target.value)} value={guessinput} id="searchBar" placeholder="guess here..." enterButton="send" disabled={!canGuess} onSearch={e=>{
            if(guessinput.trim()=="") displayStatus({type:"error", msg:"guess can't not be blank"});
            else if(!(/^[a-zA-Z\s]*$/.test(guessinput)))displayStatus({type:"error", msg:"guess can't contain non-letter"});
            else if(guessinput.length>=20) displayStatus({type:"error", msg:"answer won't be longer than 20 words"});
            else{
              guessWord(e, me._id);
              setguessinput("")
          }}}></Input.Search>
            </div>
            <div className="chatright">{(drawing)? <Progress strokeColor={progcolor} type="circle" percent={roundTime}  format={()=>word} showInfo={isdrawer} className="progress" />:<></>}</div>
          </div>
        </div>
      </div>
    )
}

export default Room;