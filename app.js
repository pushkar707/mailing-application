if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const express = require('express')
const mongoose = require('mongoose')
const Client = require('./models/Client')
const ejsMate = require('ejs-mate')
const nodemailer = require('nodemailer');
const methodOverride = require('method-override')

const app = express()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILID,
      pass: process.env.NODEMAILPASS
    }
  });

mongoose.connect(process.env.MONGODBURI,()=>{
    console.log("Connected to mongoose");
})

app.use(express.urlencoded({extended:true}))
app.engine('ejs',ejsMate)
app.set('view engine','ejs')
app.use(methodOverride('_method'))

// ALL CLIENTS
app.get('/',async(req,res)=>{
    const clients = await Client.find({})
    clients.reverse()
    res.render('all',{clients})
})


// ADD CLIENTS
app.get('/add',async(req,res)=>{
    res.render('add')
})
app.post('/add',async(req,res)=>{
    const client = new Client(req.body)
    await client.save()
    res.redirect('/')
})


//SINGLE CLIENT
app.get('/:id',async(req,res)=>{
    const client = await Client.findById(req.params.id)
    res.render('client',{client})
})
app.put('/:id',async(req,res)=>{
    const client = await Client.findByIdAndUpdate(req.params.id,req.body)
    res.redirect('back')
})
app.delete('/:id',async(req,res)=>{
    await Client.findByIdAndDelete(req.params.id)
    res.redirect('back')
})


// PPROSPECT TO CLIENT
app.post('/:id/add',async(req,res)=>{
    const client = await Client.findByIdAndUpdate(req.params.id,{$push:{people:req.body}})
    if(client.status.slice(0,10) == 'All Mailed'){
        client.status = "Not " + client.status
        await client.save()
    }
    res.redirect('back')
})
app.delete('/:id/:personId',async(req,res)=>{
    await Client.findByIdAndUpdate(req.params.id,{$pull:{people:{_id:req.params.personId}}})
    res.redirect('back')
})


// MAIL ALL PROSPECTS OF CLIENT
app.post('/:id/mail',async(req,res)=>{
    let {subject,body} = req.body
    let text = body.replace('\r\n/g','<br>')
    const today = new Date()
    const mailDate = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear().toString().slice(2,)}`
    const client = await Client.findById(req.params.id)
    let {people} = client
    subject = subject.replace('(website)',client.website.slice(8,client.website.length-1))
    text = text.replace('(websiteUrl)',client.website)
    const newPeople = people.map(person => {
        if(person.status=='Not mailed'){
            const previousText = text
            text = person.name ? text.replace('(name)',person.name) : text.replace(' (name)','')
            text = text.replace('(company)',client.name)
            text = text.replace('(post)',(person.post ? "you work as "+person.post : 'this is point of contact'))
            var mailOptions = {
                from: process.env.NODEMAILID,
                to: person.email,
                subject, text
            };
            transporter.sendMail(mailOptions)
            person.status = 'Mailed on '+mailDate
            text = previousText
        }
        return person
    })
    client.status = `All Mailed on ${mailDate}`
    client.people = newPeople
    await client.save()
    res.redirect('back')
})

app.listen(3000,()=>{
    console.log("Running of port 3000");
})