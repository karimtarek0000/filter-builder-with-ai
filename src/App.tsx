import axios from 'axios'
import { useEffect, useState } from 'react'
import './App.css'
import { ReactImage } from './components/image/ReactImage'

interface PicsumImage {
  id: string
  author: string
  width: number
  height: number
  url: string
  download_url: string
}

const App = () => {
  // const [images, setImages] = useState<PicsumImage[]>([])

  // useEffect(() => {
  //   const getImages = async () => {
  //     try {
  //       const { data } = await axios.get<PicsumImage[]>(
  //         'https://picsum.photos/v2/list?page=1&limit=100',
  //       )
  //       setImages(data)
  //     } catch (error) {
  //       console.log(error)
  //     }
  //   }

  //   getImages()
  // }, [])

  return (
    <main>
      <h1>test</h1>
    </main>
  )
}

export default App
