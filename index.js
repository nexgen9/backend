const port =4000;
const express= require('express');
const app =express()
const  jwt = require("jsonwebtoken")
const path = require ("path")
const multer = require ("multer")
const cors =require ("cors")
const mongoose =require("mongoose")

app.use(express.json());
app.use(cors())

//databaseconnect with mongodb


mongoose.connect(process.env.MONGODB_URL)
.then(() => console.log("MongoDB connected"))
.catch(error => console.log("MongoDB connection error:", error));

//api creation

app.get("/",(req,res)=>{
    res.send("hello")



})


//image storage

const storage = multer.diskStorage({
    destination:"./upload/images",
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload= multer({
    storage:storage
})

//creat upload 
app.use('/images',express.static("upload/images"))
app.post("/upload",upload.single("product"),(req,res)=>{
    if (!req.file) {
        return res.status(400).send({ success: 0, message: "File upload failed" });
       
    }
    res.json({
        success: 1,
        image_url: `http://localhost:4000/images/${req.file.filename}`
    });
   
})
//schema for order 
const OrderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    shipping: { type: String, required: true },
    cartItems: { type: Array, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now }
  });
  
  const Order = mongoose.model('Order', OrderSchema);
  module.exports = Order;
 //schema for product

const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true,

    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true,
    },
})

app.post("/addproduct",async (req,res)=>{
    console.log("ll")
let products =await Product.find({});
let id;
 if(products.length>0){
 let last_product_array=products.slice(-1);
 let last_product =last_product_array[0];
 id=last_product.id+1
}
else{
    id=1;
}

    const product =new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
       price:req.body.price,
       

    }) ;
   
     await product.save();
    
     res.json({
        success:true,
        name:req.body.name
     })
})
//orders
const orders = [];
app.post("/orders",async (req, res) => {
    
    const { name, phone, state, city, shipping, cartItems } = req.body;
  
    // Check if all required fields are present
    if (!name || !phone || !state || !city || !shipping || !cartItems ) {
        
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    
    const newOrder = new Order({
        name,
        phone,
        state,
        city,
        shipping,
        cartItems
      });
    
    try {
        await newOrder.save();
        return res.json({ success: true, message: "Order placed successfully", order: newOrder });
      } catch (error) {
        console.error("Error saving order:", error);
        return res.status(500).json({ success: false, message: "Error placing order" });
      }
  });
  
  // GET endpoint to fetch all orders (for admin)
  app.get("/orders", async (req, res) => {
    try {
      const orders = await Order.find(); // Fetch all orders from MongoDB
      return res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, message: "Error fetching orders" });
    }
  });
//new collection
app.get("/newcollection",async (req,res)=>{
 let products=await Product.find({})
 let newcollection = products.slice(1)
 res.send(newcollection)
})
// related product
app.get("/related",async (req,res)=>{
 let products=await Product.find({})
 let related = products.slice(1).slice(5);
 res.send(related)
})
//popular in women 
app.get("/popularinwomen",async(req,res)=>{
    let products = await Product.find({category:"women"});
    let popular = products.slice(0,4)
    res.send(popular)
})
// cart data 
app.post("./addtocart",async(req,res)=>{

})


//delet product 
app.post("/removeproduct",async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
   
    res.json({
        success:true,
        name:req.body.name
    })
})

//delet order 
app.post("/removeorder", async (req, res) => {
    const { id } = req.body;
  
    try {
        const order = await Order.findByIdAndDelete(id); // Use MongoDB to delete the order by _id
    if (order) {
      return res.json({ success: true, message: "Order deleted successfully" });
    } else {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ success: false, message: "Error deleting order" });
  }
  });
// search
app.get("/search", async (req, res) => {
    const searchTerm = req.query.q;
    try {
      const products = await Product.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search
          { category: { $regex: searchTerm, $options: "i" } } // Case-insensitive search
        ]
      });
      res.json(products);
    } catch (error) {
      console.error("Error searching for products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

//getting all
app.get("/allproducts",async (req,res)=>{
    let products = await  Product.find({});
   


 res.json(products);
})

app.listen(port,(error)=>{

    if(!error){
        console.log("server running on "+port)
    }
    else{
        console.log("error: "+error)
    }
})