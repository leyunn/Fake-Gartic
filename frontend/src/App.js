import './App.css';
import {message} from "antd";
import Room from './Containers/Room';
import Begin from './Containers/Begin';
import { useState, useEffect } from "react";
// const LOCALSTORAGE_KEY = "gartic";

const App= ()=> {
  const displayStatus = (payload) => {
    if (payload.msg) {
        const { type, msg } = payload
        const content = {content: msg, duration: 0.5 }
    switch (type) {
      case 'success':
      message.success(content)
      break
      case 'error':
      default:
         message.error(content)
         break
  }}}

  const [start, setStart] = useState(false);
  // const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);
  const [me, setMe] = useState({name: "", draw:false, correct: false, me:true, score:0, color:"#BAD4AA"});
  const [roomInfo, setRoomInfo] = useState([]);
  return (
    <div className="App">
      {start? (<Room me={me} info={roomInfo} displayStatus={displayStatus} setMe={setMe} setStart={setStart}/>) : (<Begin start={start} setStart = {setStart} setMe={setMe} me = {me} setInfo={setRoomInfo} displayStatus={displayStatus}/>)}
    </div>
  );
}

export default App;
