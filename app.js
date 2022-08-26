const path = require('path');
const express= require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const {graphqlHTTP}= require('express-graphql');
const graphqlSchmea= require('./graphql/schema');
const graphqlResolver= require('./graphql/resolver');
const auth = require('./middleware/auth');

const app = express();


// const fileStorage = multer.fileStorage({
//     destination : (req,file,cb)=>{
//         cb(null,'images');
//     },
//     filename : (req,file,cb)=>{
//         cb(null,new Date().toISOString + '-' + file.originalname);
//     }
// });
// const fileFilter= (req,file,cb)=>{
//     if(file.mimetype==='image/png'||file.mimetype==='image/jpeg'||file.mimetype==='image/jpeg'){
//         cb(null,true);
//     }
//     else{
//         cb(null,false);
//     }
// };

app.use(bodyParser.json());
//app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use('/images',express.static(path.join(__dirname,'images')));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    if(req.method==='OPTIONS'){
        return res.sendStatus(200);
    }
    next();
})



app.use(auth);

app.use('/graphql',graphqlHTTP({
schema: graphqlSchmea,
rootValue:graphqlResolver,
graphiql:true,
customFormatErrorFn(err){
    if(!err.originalError){
        return err;
    }
    const data = err.originalError.data;
    const message= err.message|| "An error occured!";
    const code= err.originalError.code|| 500;
    return{message:message,status:code,data:data};
}
}));

app.use((error,req,res,next)=>{
    console.log(error);
    const status = error.statusCode||500;
    const message= error.message;
    res.status(status).json({
        message:message,
        data:error.data
    });
})

mongoose.connect(
    "mongodb+srv://rahul:rahul@cluster0.ytelh.mongodb.net/messages?retryWrites=true&w=majority"
)
.then(result=>{
 app.listen(8080);
})
.catch(err=>console.log(err))
