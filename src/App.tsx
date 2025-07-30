import { useEffect, useRef } from 'react'
import './App.css'
import { Stack3D } from './classes/Stack3D';

function App() {

  const canvas = useRef<HTMLCanvasElement>(null);

  const stack3D = useRef<Stack3D | null>(null);

  useEffect(() => {
    stack3D.current = new Stack3D(
      'SE232BD', 
      canvas.current as HTMLCanvasElement,
      true);

  }, []);

  return (
    <>
      <div className='is-full-screen is-full-width row'>
        {/* <div className='col col-6'> */}
        <canvas ref={canvas}></canvas>
        {/* 
        </div>
        <div className='col col-6 bg-error'></div> 
        */}

      </div>
    </>
  )
}

export default App
