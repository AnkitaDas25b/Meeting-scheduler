
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const cors = require('cors');

app.use(express.json());  
app.use(cors());


//connecting to db
const MONGO_URI = "mongodb://127.0.0.1:27017/meetingScheduler";
mongoose.connect(MONGO_URI)
  .then(() => console.log(" MongoDB Connected "))
  .catch(err => console.error( err));

//db schema
const MeetingSpaceSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  meetings: [{
    title: String,
    startTime:Date,
    creator: String
  }]
});

const MeetingSpace = mongoose.model('MeetingSpace', MeetingSpaceSchema);


// SPACE ROUTE 
app.post('/spaces/create', (req, res) => {
 
  const { spaceName, code } = req.body;
  const newSpace = new MeetingSpace({ name: spaceName, code, meetings: [] });

  //save return a promise
  newSpace.save()
    .then((savedSpace) => {
      console.log(savedSpace);
     
      res.json(savedSpace);
    })
    .catch((error) => {
      
      res.json({ error: "Space code must be unique" });
    });
});

app.get('/spaces/:code', (req, res) => {
  
  MeetingSpace.findOne({ code: req.params.code })
    .then((space) => {
      
      if (!space) {
        return res.json({ error: "Space not found" });
      }
      
      res.json(space);
    })
    .catch((error) => {
      res.json({ error: "Server error" });
    });
});


app.post('/spaces/:code/schedule', (req, res) => {
  const { title, startTime, creator } = req.body;

  MeetingSpace.findOne({ code: req.params.code })
    .then((space) => {
      if (!space) {
       
        res.json({ error: "Space not found" });
        return null; 
      }
      
      
      const parsedDateTime = new Date(startTime);

      space.meetings.push({ title, startTime :parsedDateTime, creator });
      console.log(space);


      return space.save();
    })
    .then((updatedSpace) => {
     
      if (updatedSpace) {
        res.json(updatedSpace);
       
      }
    })
    .catch((error) => {
      
      res.json({ error: "Server error" });
    });
});

app.listen(5000, () => console.log(` Backend running on port 5000`));

