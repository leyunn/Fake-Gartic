import { useState, useEffect } from "react";
import {Modal} from 'antd';
let client = new WebSocket('ws://localhost:8080');

const useGame = ({displayStatus}) =>{
    
    const isOpen= (ws)=> { return ws.readyState === ws.OPEN }

    const connect= async ()=> {
        // client = new WebSocket('ws://localhost:8080');
        // client.onopen = ()=> {
        //     console.log("server reconnected");
        // }
    }

    client.onclose = e=> {
        error({title:"Server connection error" , msg:"sorry server is having some trouble, please refresh the page"})
        // setTimeout(function() {
        //     connect();
        // }, 2000);
    };

    client.onerror = e =>{
        // error({title:"Server crash" , msg:"sorry, server is having some trouble, please refresh the page"})
        client.close();
    }

    const error=({title, msg})=> {
        Modal.error({
          title: title,
          content: msg,
        });
      }

    const [status, setStatus] = useState({});
    client.onmessage = (message)=>{
        let {data} = message;
        data = JSON.parse(data);
        setStatus(data);
        // console.log(data);
    }

    const sendData = async (data)=>{
        if (!isOpen(client)){
            // error({title:"Connection error" , msg:"sorry, server is having some trouble, please refresh the page"})
            client.close();
            return;
        }
        console.log(data.type)
        client.send(JSON.stringify(await data));
    }
    const joinRoom = (me) => {
        const data = {type: "JOIN", data:me};
        sendData(data);
        
    };

    const confirmRoundStart = () => {
        const data = {type: "START", data:{}};
        sendData(data); 
    };

    const guessWord = (word, me) => {
        const data = {type: "GUESS", data:{sender: me, body: word}};
        sendData(data); 
    };
    const sendDraw = ({type,color,x,y})=>{
        const data = {type:'DRAW', data:{type,color,x,y}}
        sendData(data)
    }

    return {joinRoom, status, confirmRoundStart,sendDraw, guessWord};
}

export default useGame;