const requestIp = require('request-ip');
const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const titlePattern = new RegExp(/(([A-z]|\s|\.|\,|\!)*)/, 'g');
      const titleMatched = title.match(titlePattern).join('');

      const authorPattern = new RegExp(/(([A-z]|\s)*)/, 'g');
      const authorMatched = author.match(authorPattern).join('');

      const emailPattern = new RegExp(/(([A-z]|\.|\@)*)/, 'g');
      const emailMatched = email.match(emailPattern).join('');

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg

      const fileExt = fileName.split('.')[fileName.split('.').length - 1];  

      if(
        (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') 
        && titleMatched.length === title.length
        && authorMatched.length === author.length
        && emailMatched.length === email.length
        ){
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch(err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const voter = await Voter.findOne({ user: clientIp });

    if(!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
    } else if(voter) {
      if(voter.votes.includes(req.params.id)) {
        res.status(500).json({ message: 'You already voted for this one' });
      } else {
        voter.votes.push(req.params.id);
        await voter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    } else {
      const newVoter = new Voter({
        user: clientIp,
        votes: [ req.params.id ], 
      });
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }
};
