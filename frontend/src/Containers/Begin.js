import '../App.css';
import {Button, Input, Avatar, Badge} from "antd";
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useState, useEffect} from "react";
import useGame from "../Hooks/useGame";

const Begin = ({start, setStart, setMe, me, setInfo, displayStatus})=>{  
    const colorList =["#BAD4AA","#73D2DE", "#FFE381","#C33C54","#A7ACD9", "#EF8354","#1C448E","#8CDEDC", "#38302E", "#FF715B","#FFA69E", "#424B54", "#84DCCF"]
    const [color, setcolor] = useState(colorList.indexOf(me.color));
    const [colorhex, setcolorhex] = useState(me.color);
    const {joinRoom, status} = useGame({displayStatus});
    const [text, setText] = useState(me.name);

    useEffect(() => {
        if(status.type == "JOINALL"){ //{type:"JOIN", data:[{name, score, color}]}
            setInfo(status.data);
            let newme = me;
            newme._id = status.data.id;
            setMe(newme);
            setStart(true)
        }
    }, [status])
    useEffect(() => {setcolorhex(colorList[color])}, [color])
    useEffect(() => {setMe({name: me.name, draw:false, correct:false, me:true, score:0, color:colorhex})}, [colorhex])

    return(
        <div className="LogIn-view">
            <p className="LogIn-title">Gartic</p>
            <span><Avatar style={{ backgroundColor: colorhex }} size={90}  className="LogIn-avatar" icon={<UserOutlined />}/>
            <EditOutlined onClick={()=>{
                console.log("click");
                setcolor((color==11)? 0: color+1)
            }} style={{ fontSize: '200%'}}/></span>
            <Input maxLength={8} value={text} autoFocus={true} onPressEnter={()=>{
                if(me.name.trim()=="") displayStatus({type:"error", msg:"name cannot be blank"})
                else if (me.name.length>8) displayStatus({type:"error", msg:"name too long (>8)"})
                else joinRoom(me); 
            }} className="LogIn-name" size="large" placeholder="enter your name" prefix={<UserOutlined />} onChange={n=>{
                setMe({name: n.target.value, draw:false, correct:false, me:true, score:0, color:colorhex});
                setText(n.target.value);
            }} />
            <Button type="primary" onClick={()=>{
                if(me.name.trim()=="") displayStatus({type:"error", msg:"name cannot be blank"})
                else if (me.name.length>8) displayStatus({type:"error", msg:"name too long (>8)"})
                else if (me.name.match(/[\u3400-\u9FBF]/) && me.name.length>5) displayStatus({type:"error", msg:"chinese name too long (<6)"})
                else joinRoom(me);             
                }}>Play</Button>
        </div>
    )
}

export default Begin;