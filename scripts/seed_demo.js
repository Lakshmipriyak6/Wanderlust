const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user');
const Listing = require('../models/listing');

const envDb = process.env.ATLASDB_URL;
const localDb = 'mongodb://127.0.0.1:27017/Wanderlust';

async function seed(){
  let connected = false;
  try{
    await mongoose.connect(envDb);
    console.log('Connected to', envDb);
    connected = true;
  }catch(e){
    console.warn('Atlas connect failed, falling back to local DB');
  }
  if(!connected){
    await mongoose.connect(localDb);
    console.log('Connected to local DB', localDb);
  }
  const demoUsername = 'demo_user_script';
  const demoEmail = 'demo_script@example.com';
  const demoPassword = 'demopassscript';
  let demo = await User.findOne({ username: demoUsername });
  if(!demo){
    demo = new User({ username: demoUsername, email: demoEmail });
    await User.register(demo, demoPassword);
    console.log('Created demo user:', demoUsername);
  } else {
    console.log('Demo user exists');
  }

  let demoListing = await Listing.findOne({ title: 'Demo Ghost Listing Script' });
  if(!demoListing){
    demoListing = new Listing({
      title: 'Demo Ghost Listing Script',
      description: 'Demo ghost created by seed script',
      price: 5000,
      ghostPrice: 299,
      isGhost: true,
      ghostExpires: new Date(Date.now() + 24*60*60*1000),
      image: { url: 'https://via.placeholder.com/800x450?text=Ghost+Script', filename: 'demo_script.jpg' },
      location: 'Hidden',
      country: 'Scriptland',
      owner: demo._id,
      ecoCertified: true,
    });
    await demoListing.save();
    console.log('Created demo listing:', demoListing._id);
  } else {
    console.log('Demo listing exists');
  }

  mongoose.connection.close();
}

seed().catch(err=>{console.error(err); process.exit(1)});
