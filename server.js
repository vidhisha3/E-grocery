//importing packages
const express = require('express');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');

//firebase admin setup
let serviceAccount = require("./e-grocery-5bbd3-firebase-adminsdk-x8v96-57f8cdd3de.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

//aws config 
const aws = require('aws-sdk');
const dotenv = require('dotenv');
const { add } = require('nodemon/lib/rules');

dotenv.config();

//aws parameters
const region = "eu-west-2";
const bucketName = "e-grocery";
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

aws.config.update({
    region, 
    accessKeyId, 
    secretAccessKey

})

// init s3
const S3 = new aws.S3();

//generate image upload file
async function generateUrl(){
    let date = new Date();
    let id = parseInt(Math.random() * 10000000000);
    
    const imageName = `${id}${date.getTime()}.jpg`;

    const params = ({
        Bucket: bucketName,
        Key: imageName,
        Expires: 300, //300ms
        ContentType:'image/jpeg'
    })
    const uploadUrl = await S3.getSignedUrlPromise('putObject', params);
    return uploadUrl;
}


// declare static path
let staticPath = path.join(__dirname, "code");


//intializing express.js
const app = express(); 

//middlewares
app.use(express.static(staticPath));
app.use(express.json())

//routes

//home route
app.get("/", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
})

//signup route
app.get('/signup', (req, res) => {
    res.sendFile(path.join(staticPath, "signup.html"));
})

app.post('/signup',(req, res)=> {
    let{name, email, password, number, tac, notification} = req.body;
    //form validation
    if(name.length<3){
        return res.json({ 'alert': 'name must be 3 letters long'});
    }else if(!email.length){
        return res.json({'alert':'Enter your E-Mail'});
    } else if(password.length < 8 ){
        return res.json({'alert':'Password should be 8 letters long'});
    } else if (!number.length){
        return res.json({'alert':'enter your Phone Number'});
    }else if(!Number(number) || number.length < 10){
        return res.json({'alert':'invaild number, please Enter Valid One'});
    }else if (!tac){
        return res.json({'alert':'you must agree to our Terms and Conditions'});
   } 
    
   //store user in db
   db.collection('users').doc(email).get()
   .then(user=>{
       if (user.exists){
           return res.json({'alert':'email already exists'});
       }else{
           //encrypt the password before the storing it.
           bcrypt.genSalt(10, (err,salt)=>{
            bcrypt.hash(password, salt,(err, hash) => {
                   req.body.password = hash;
                   db.collection('users').doc(email).set(req.body)
                   .then(data => {
                       res.json({
                           name: req.body.name,
                           email: req.body.email,
                           vendor: req.body.vendor,
                       })
                   })
               } )
           })
       }
   })
})

//login route
app.get('/login',(req,res)=>{
    res.sendFile(path.join(staticPath,"login.html"));
})

// login post 
app.post('/login',(req, res ) => {
    let {email, password} = req.body;

    if (!email.length || !password.length){
        return res.json({ 'alert': 'Enter Your Login Detials'})
    }
    db.collection('users').doc(email).get()
    .then(user => {
        if (!user.exists){
            return res.json({'alert': 'login in E-mail does not exists'})
        } else{
            bcrypt.compare(password, user.data().password, (err, result)=> {
               if (result){
                   let data = user.data();
                   return res.json({
                       name: data.name,
                       email: data.email,
                       vendor: data.vendor,
                   })
               }else{
                   return res.json({'alert':'password is incorrect'});
               } 
            })
        }
    })
})

//vendor route
app.get('/vendor',(req,res)=>{
    res.sendFile(path.join(staticPath,"vendor.html"));
})

app.post('/vendor',(req,res)=> {
    let{name, about, address, number, tac, legit, email}= req.body;
    if(!name.length || !address.length || !about.length || number.length < 10 || 
        !Number(number)){
            return res.json({'alert': 'some information are invalid'});
        } else if (!tac || !legit){
            return res.json ({'alert': 'you must agree to E-grocery Terms and Continue'});
        } else {
            //update the users vendor status here.
            db.collection('vendors').doc(email).set(req.body)
            .then(data => {
                db.collection('users').doc(email).update({
                    vendor:true
                }).then(data => {
                    res.json(true);
                })
            })
        }
})

// add product
app.get('/add-product',(req,res)=>{
    res.sendFile(path.join(staticPath,"addproduct.html"));
})

// add product
app.get('/add-product/:id',(req,res)=>{
    res.sendFile(path.join(staticPath,"addproduct.html"));
})

//get the upload link
app.get('/s3url',(req,res) => {
    generateUrl().then(url => res.json(url));
})

//add product
app.post('/add-product',(req, res) => {
    let { name, shortDes, des, images, sizes, actualPrice, discount, 
        sellPrice, stock, tags, tac, email, draft, id } = req.body;   
    //validation 

    if(!draft){
        if(!name.length){
            return res.json({'alert':'enter the product name'});
         }else if(shortDes.length > 100 || shortDes.length < 10 ){
             return res.json({'alert':'short description must to be 10 to 100 letters long'});
         }else if(!des.length){
             return res.json ({'alert':'enter detail description'});
         }else if(!images.length){ //imagelink array
             return res.json({'alert':'upload atleast one product image'})
         }else if(!sizes.length){
             return res.json({'alert':'select at least one size'});
            } else if(!actualPrice.length || !discount.length || !sellPrice.length){
             return res.json({'alert':'you must add pricings'});
         }else if(stock < 20){
             return res.json({'alert':'you should have at least 20 in stock'});
         }else if(!tags.length){
             return res.json({'alert':'enter few to help ranking you product in search'});
         }else if(!tac){
             return res.json({'alert':'you must agree to out terms and conditions'});
         }
}
     //add product
     let docName = id == undefined ? `${name.toLowerCase()}-${Math.floor(Math.random() * 5000)}` : id;
     db.collection('products').doc(docName).set(req.body)
     .then(data => {
        res.json({'product':name});
     })
     .catch(err => {
         return res.json({'alert':'some error occured'});
     })
})

//get route
app.post('/get-products', (req, res) => {
    let {email, id, tag  } = req.body;

    if(id){
        docRef = db.collection('products').doc(id)
    }else if(tag){
        docRef = db.collection('products').where('tags','array-contains',tag)
    }else{
        docRef = db.collection('products').where('email', '==', email)
    }

    docRef.get()
    .then(products => {
        if (products.empty){
            return res.json('no products');
        }
        let productsArr = []; 
        if (id){
            return res.json(products.data());
        }else {
            products.forEach(item =>{
                let data = item.data();
                data.id = item.id;
                productsArr.push(data); 
            })
            res.json(productsArr)
        }
    })
})

app.post('/delete-product', (req,res) =>{
    let {id} = req.body;

    db.collection('products').doc(id).delete()
    .then(data => {
        res.json('success');
    }).catch(err => {
        res.json('err');
    })  
})

//product page
app.get('/products/:id', (req,res) => {
    res.sendFile(path.join(staticPath, "product.html"));
})
 
app.get('/search/:Key', (req, res) => {
    res.sendFile(path.join(staticPath, "search.html"));
})

app.get('/cart', (req, res) => {
    res.sendFile(path.join(staticPath,"cart.html"));
})

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(staticPath, "checkout.html"))
})

app.post('/order', (req, res) => {
    const {order, email, add} = req.body;

    let transpoter = nodemailer.createTransport({
        service: 'yahoo',
        auth:{
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    })

    const mailOption= {
        from: 'vidhishapatel@yahoo.com',
        to: email,
        subject: 'E-grocery: Order Placed',
        html:`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        
            <style>
                body{
                    min-height:90vh;
                    background:#f5f5f5;
                    font-family:sans-serif;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                }
                .heading{
                    text-align:center;
                    font-size:40px;
                    width:50%;
                    display:block;
                    line-height:50px;
                    margin:30px auto 60px;
                    text-transform:capitalize;
                }
                .heading span{
                   font-weight: 300; 
                }
                .btn{
                    width:200px;
                    height:50px;
                    border-radius:5px;
                    background: #58e629;
                    color:#fff;
                    display:block;
                    margin:auto;
                    font-size:18px;
                    text-transform:capitalize;
                    }
            </style>
        
        </head>
        <body>
            
            <div>
                <h1 class="heading">dear ${email.split('@')[0]},<span>your order is successfully</span></h1>
                <button class="btn"> Check Status</button>
            </div>
        
        </body>
        </html>
    </div>
        `
    }

    let docName= email + Math.floor(Math.random() * 123719287419824);
    db.collection('order').doc(docName).set(req.body)
    .then(data => {
       transpoter.sendMail(mailOption, (err, info) => {
           if(err){
               res.json({'alert': 'opps! its seems like some err occured. try again'})
           }else{
               res.json({'alert': 'your Order is placed'});
           }
       })

    })    
})

// 404 route
app.get('/404', (req, res) => {
    res.sendFile(path.join(staticPath, "404.html"));
})

app.use((req, res) => {
    res.redirect('/404');
})

app.listen(3000, () => {
    console.log('listening on port 3000.......');
})