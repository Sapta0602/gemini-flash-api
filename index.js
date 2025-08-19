import express from 'express'
import dotenv from 'dotenv'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
const port = 3000

dotenv.config()
app.use(express.json())


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({model: 'models/gemini-2.5-flash'})
const upload = multer({dest: 'uploads/'})

app.listen(port, () => {
    console.log(`Gemini API server is running at HTTP://localhost:${port}`)  
})

app.post('/generate-text', async (req,res) => {
    const {prompt} = req.body

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        res.json({output: response.text()})

    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

function imageGenerativePart(imagePath) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(imagePath)).toString('base64'),
            mimeType: 'image/jpeg'
        }
    }
}

app.post('/generate-from-image', upload.single('image'), async (req,res) => {
    const prompt = req.body.prompt || 'Describe the image'
    const image = imageGenerativePart(req.file.path)

    try {
        const result = await model.generateContent([prompt, image])
        const response = await result.response
        res.json({output: response.text()})

    } catch (error) {
        res.status(500).json({error: error.message})
    } finally{
        fs.unlinkSync(req.file.path)
    }
})


app.post('/generate-from-document', upload.single('document'), async (req,res) => {
    const prompt = req.body.prompt || 'Analyze this document'
    const buffer = fs.readFileSync(req.file.path)
    const base64Data = buffer.toString('base64')
    const mimeType = req.file.mimetype

    try {
        const documentPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        }
        const result = await model.generateContent([prompt, documentPart])
        const response = await result.response
        res.json({output: response.text()})

    } catch (error) {
        res.status(500).json({error: error.message})
    } finally{
        fs.unlinkSync(req.file.path)
    }
})

app.post('/generate-from-audio', upload.single('audio'), async (req,res) => {
    const prompt = req.body.prompt || 'Transcribe or analyze the following audio'
    const buffer = fs.readFileSync(req.file.path)
    const base64Audio = buffer.toString('base64')
    const mimeType = req.file.mimetype

    try {
        const audioPart = {
            inlineData: {
                data: base64Audio,
                mimeType: mimeType
            }
        }
        const result = await model.generateContent([prompt, audioPart])
        const response = await result.response
        res.json({output: response.text()})

    } catch (error) {
        res.status(500).json({error: error.message})
    } finally{
        fs.unlinkSync(req.file.path)
    }
})