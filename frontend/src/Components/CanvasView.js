import React, { useRef, useEffect, useState } from 'react'
import "../App.css"

const CanvasView = ({data}) => {
    const canvasRef = useRef(null)
    const contextRef = useRef(null)
    const [color, setColor] = useState('black');
    useEffect(()=>{
        const canvas = canvasRef.current;
        canvas.width = 626.670;
        canvas.height = 374;
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;
        const context = canvas.getContext("2d")
        context.scale(2,2)
        context.lineCap = "round"
        context.strokeStyle = color
        context.lineWidth = 1;
        contextRef.current = context
    },[])

    useEffect(()=>{
        const {type,x,y,color} = data;
        switch(type){
            case 'lineTo':{
                contextRef.current.lineTo(x, y)
                break;
            }
            case 'stroke':{
                contextRef.current.stroke()
                break;
            }
            case 'clearRect':{
                contextRef.current.clearRect(x, y, 10, 10)
                break;
            }
            case 'beginPath':{
                contextRef.current.beginPath()
                break;
            }
            case 'closePath':{
                contextRef.current.closePath()
                break;
            }
            case 'color':{
                setColor(color)
                break;
            }
            case 'clean':{
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                break;
            }
        }
    },[data])
    useEffect(()=>{
        contextRef.current.strokeStyle = color
    }, [color])
    return (
        <div className='Canvas'>
        <canvas ref={canvasRef}/>
        </div>
    )
}

export default CanvasView