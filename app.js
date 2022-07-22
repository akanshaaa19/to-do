const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb+srv://akansha:akansha@cluster0.xujh5ky.mongodb.net/tasks");

const itemsSchema = new mongoose.Schema({
    name: String,
})

const Item =  new mongoose.model("item", itemsSchema);


const checkSchema = new mongoose.Schema({
    _id: String,
    taskName: String
})

const Checked = new mongoose.model("Checked", checkSchema);


const collectionSchema = new mongoose.Schema({
    title: String,
    items: [itemsSchema],
    checkedItems: [checkSchema],
    color: String
})

const Collection =  new mongoose.model("Collection", collectionSchema);

let i=0;
const colors = ["#6080BF", "#FB6B74", "#AEBCF5", "#A3D9CF", "#FFC8CB", "#CB3E62", "#03A688", "#F0BA8E", "#733068", "#FFE599"];

app.get("/", (req, res)=>{
    Collection.find({}, (err, foundCollections)=>{
        if(!err){
            res.render("home", {collections: foundCollections})
        }
        else{
            console.log(err)
        }
    })
});

app.get("/:collectionName", (req, res)=>{
    const title = req.params.collectionName;

    if(title === "tasks-app"){
        res.render("splash");
    }else{

        Collection.findOne({title: title}, (err, foundCollection)=>{
            if(err){
                console.log(err)
            }else{
                res.render("collectionPage", {collectionTitle: title, items: foundCollection.items, checkedItems: foundCollection.checkedItems})
            }
        })
    }

})


app.post("/", (req, res)=>{
    const input = _.upperFirst(req.body.collectionName);
    const color = colors[i];

    if(i>9){
        i=0
    }else{
        i++
    }

    const newCollection = new Collection({
        title: input,
        color: color
    });

    newCollection.save();
    res.redirect("/");
});

app.post("/addNewTodo", (req, res)=>{
    const collectionName = req.body.collectionName;
    const task = req.body.todoInput;

    const newItem = new Item({
        name: task,
    })

    newItem.save()

    Collection.findOne({title: collectionName}, (err, foundList)=>{
        if(err){
            console.log(err)
        }else{
            foundList.items.push(newItem);
            foundList.save(()=>{
                res.redirect("/" + collectionName)
            });
        }
    })
    
    
});

app.post("/check", (req, res)=>{
    const id= req.body.taskId;
    const collectionName= req.body.listName;
    const taskName = req.body.taskName;


    Collection.findOne({title: collectionName}, function(err, foundCollection){
        foundCollection.items.pull({ _id: id }); 
        foundCollection.save();
    });

    const checkedItem = new Checked({
        _id: id,
        collectionTitle: collectionName,
        taskName: taskName
    })

    checkedItem.save();

    Collection.findOne({title: collectionName}, (err, foundList)=>{
        if(err){
            console.log(err)
        }else{
            foundList.checkedItems.push(checkedItem);
            foundList.save(()=>{
                res.redirect("/" + collectionName)
            });
        }
    })

    
})

app.post("/uncheck", (req, res)=>{
    const id= req.body.taskId;
    const collectionName= req.body.listName;
    const taskName = req.body.taskName;

    const newItem = new Item({
        name: taskName,
    })
    
    newItem.save()

    Collection.findOne({title: collectionName}, function(err, foundCollection){
        foundCollection.checkedItems.pull({ _id: id }); 
        foundCollection.save();
    });

    Collection.findOne({title: collectionName}, (err, foundList)=>{
        if(err){
            console.log(err)
        }else{
            foundList.items.push(newItem);
            foundList.save(()=>{
                res.redirect("/" + collectionName);
            });
        }
    })
})

app.post("/deleteCollection", (req, res)=>{
    const collectionId = req.body.collectionId;
    Collection.findOneAndDelete({_id: collectionId}, function (err, docs) {
        if (err){
            console.log(err)
        }
        else{
            res.redirect("/")
        }
    });
})

app.post("/deleteTodo", (req, res)=>{
    const id = req.body.id;
    const name = req.body.collectionName;
    console.log(req.body)

    Collection.findOne({title: name}, function(err, foundCollection){
        foundCollection.items.pull({ _id: id }); 
        foundCollection.save(function(){
            res.redirect("/" + name);
        });
      });


})

app.post("/deleteCheckedTodo", (req, res)=>{
    const id = req.body.id;
    const name = req.body.collectionName;

    Collection.findOne({title: name}, function(err, foundCollection){
        foundCollection.checkedItems.pull({ _id: id }); 
        foundCollection.save(function(){
            res.redirect("/" + name);
        });
      });


})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);