const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

const username = process.env.USER_NAME;
const password= process.env.PASS_WORD;


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

main().catch(err => console.log(err));
async function main() {

    // todolistDB database'ine bağlandık.
    await mongoose.connect('mongodb+srv://'+username+':'+password+'@cluster0.1wtzxtq.mongodb.net/todolistDB');
    const itemsSchema = new mongoose.Schema ({
        name: String
    });
    const Item = mongoose.model("Item", itemsSchema)
    const item1 = new Item({
        name: "Welcome to your todolist"
    });
    const item2 = new Item({
        name: "Hit the + button to add a new item."
    });
    const item3 = new Item({
        name: "<-- Hit this to delete an item."
    });
    const defaultItems = [item1, item2, item3];

    const listSchema = new mongoose.Schema ({
        name: String,
        items: [itemsSchema]
    });
    const List = mongoose.model("List", listSchema);

    app.get("/", function(req, res) {
        Item.find({}, function(err, foundItems){
            if(foundItems.length === 0) {
                Item.insertMany(defaultItems, function(err){
                    if (err) {
                       console.log(err) 
                    }else {
                        console.log("Successfully saved default items to DB.");
                    }
                })
            }    
            res.render("list", {listTitle:"Today", newListItems: foundItems});
        })
    });

    app.get("/:customListName", function(req, res){
        const customListName = toTitleCase(req.params.customListName);
        List.findOne({name: customListName}, function(err, foundList){
            if(!err){
                if(!foundList){
                    //Create a new List
                    const list = new List({
                        name: customListName,
                        items: defaultItems
                    });
                    list.save();
                    res.redirect("/" + customListName);
                }else {
                    //Show an existing List
                    res.render("list", {listTitle:foundList.name, newListItems: foundList.items});
                }
            }
        })
    });

    app.post("/", function(req, res) {
        const itemName = req.body.newItem;
        const listName = req.body.list;

        const item = new Item({
            name: itemName
        })
        
        if (listName === "Today"){
            item.save();
            res.redirect("/");
        }else {
            List.findOne({name: listName}, function(err, foundList){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName)
            })
        }
    });

    app.post("/delete", function(req, res){
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;

        if(listName === "Today") {
            Item.findByIdAndDelete(checkedItemId, function(err){
                if (!err) {
                    console.log("Successfully deleted checked item")
                    res.redirect("/");
                }
            })
        }else {
            List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
        }
    })
}


function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }


app.listen(3000, function() {
    console.log("Server is running on port 3000.")
});