let express=require("express")
let cors=require("cors")
let app=express()
let env=require("dotenv")
env.config()

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let chatHistory=[]

app.use(express.json())
app.use(cors())

app.post("/",async (req,res)=>{//make sure the data is in this format only, need to take question and prompt from user, //need not to send the history from fe if be url exists
    try{
        let questionData=req.body.contents[0].parts[0].text
        if(!questionData){
            throw new Error('No question provided');
        }
        
        chatHistory.push({role:"user",message:questionData})//i will be taking prompt from fe
        
        let historyForAPI = chatHistory.map((chat) => `${chat.role}: ${chat.message}`).join('/n');

        // let prompt=`The user is asking the following question: ${questionData}\n\n Here's the full context of the conversation so 
        // far:\n\n${historyForAPI}`; 

        // not implementing history from be just now bc, there will be many users using same be
        // and all data will be stored here, which will result in wierd responses from ai, what i can do now is either 
        // issue auth token to identify user and maintain his history or ask user to send history from fe, co=hoosing the 
        // second one for now

        let prompt= `${questionData}`;

        let result = await model.generateContent(prompt);
        chatHistory.push({role:"bot",message:result.response.candidates[0].content.parts[0].text})
        
        res.json({
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": result.response.candidates[0].content.parts[0].text,
                                prompt
                            }
                        ]
                    }
                }
            ]
        })
    }
    
    catch(err){
        console.log(err);
        
        res.status(400).json({
            message: "Error while parsing data, make sure to send the question in specified format only. If you format is correct then maybe gemini ratelimited api. See error message",
            error: err
        })
    }
})

app.get("*",(req,res)=>{
    res.status(400).json({
        message: "You typed wrong URL, goto '/' to start asking questions"
    })
})

app.listen(3000,()=>{console.log("The server is running at port 3000");})

module.exports=app