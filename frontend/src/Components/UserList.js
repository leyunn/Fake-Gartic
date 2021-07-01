import { UserOutlined, CheckCircleTwoTone, TrophyFilled } from '@ant-design/icons';
import { Avatar } from 'antd';
const UserList = ({users})=>{
    return(users.map((n, i)=>(
        <div className={(n.me)?"myuserbox":"userbox"} style={{marginTop: (i==0)?"10px":"0px"}}>
            <Avatar style={{ backgroundColor: n.color }} className="userbox_avatar" size={54} icon={<UserOutlined />} />
            <p className="userbox_name">{(n.draw)? `${n.name} (drawer)`:`${n.name}`}<br/><span className="userbox_score">score: {n.score}</span></p>
            {/* {(true)?<TrophyFilled className="trophy" />:<div className="trophy"></div>} */}
            {(n.correct)?<CheckCircleTwoTone className="check" twoToneColor="#52c41a" />:<div className="check"></div>}
        </div>
    )))
}

export default UserList;