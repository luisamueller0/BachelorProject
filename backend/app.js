import express from 'express'
import cors from 'cors'
import artist from './src/routes/artist'
import exhibition from './src/routes/exhibition'
import generativeAI from './src/routes/generativeAI';
require('dotenv').config()

const app = express()
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/artist/', artist)
app.use('/exhibition/', exhibition)
app.use('/ai/', generativeAI);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT} \n Press CTRL-C to stop\n`));
