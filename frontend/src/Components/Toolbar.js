import pencil from "../Images/pencil.png"
import eraser from "../Images/eraser.png"
import broom from "../Images/broom.png"

const Toolbar = ({contextRef, canvasRef, handleChange, setMode, mode, sendDraw})=>{
    const handleClick = ()=>{
        sendDraw({type:'clean'})
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    return(<div className='toolbar'>
    <div className="icon"><input type="color" id="color_picker" onChange={handleChange}/></div>
    <img src={pencil} style={{filter: (mode=='pencil')? "invert(66%) sepia(36%) saturate(431%) hue-rotate(80deg) brightness(103%) contrast(85%)":"none"}} className="icon" width="30" height="30" onClick={()=>{setMode('pencil')}}/>
    <img src={eraser} style={{filter: (mode=='eraser')? "invert(66%) sepia(36%) saturate(431%) hue-rotate(80deg) brightness(103%) contrast(85%)":"none"}} className="icon" width="30" height="30" onClick={()=>{setMode('eraser')}}/>
    <img src={broom} className="icon" width="30" height="30" onClick={handleClick} />
    </div>)
}

export default Toolbar;