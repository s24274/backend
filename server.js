const express = require('express')
const cors = require('cors')
const { MongoClient, ObjectId } = require('mongodb')


const app = express()
const port = process.env.PORT || 3000
const dbUri = 'mongodb://127.0.0.1:27017'
const dbName = 'test'
// const api = require('./api.js')


app.set('view cache', true)

app.use('/api', cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('siema')
})

app.get('/healthcheck', (req, res) => {
    res.send('hamburger!')
})


app.get('/products', async (req, res) => {
    const query = req?.body || {}
    const sort = query?.sort || {}
    delete query.sort

    const result = await dbFind(query, sort)
    res.send(result)
})

app.post('/products', async (req, res) => {
    const query = req?.body || {}

    const result = await dbAdd(query)
    res.send(result)
})

app.put('/products/:id', async (req, res) => {
    const id = new ObjectId(req?.params?.id || '')

    const query = req?.body || {}
    const newData = query?.newData || {}
    delete query.newData

    const result = await dbUpdate({ '_id': id, ...query }, newData)
    res.send(result)
})


app.listen(port, async () => {
    console.log(`localhost:${port}`)

    const client = new MongoClient(dbUri)
    // const client = new MongoClient(dbUri, {
    //     useNewUrlParser: true,
    //     useUnifiedTopology: true,
    // })

    try {
        await client.connect()

        const db = client.db(dbName)
        const pingResult = await db.admin().command({ ping: 1 })

        if (!pingResult.ok)
            throw new Error('serwer nie pinguje')

        console.log('dziala')
    }
    catch (error) {
        console.error('wyjebane', error)
    }
    finally {
        await client.close()
        console.log('zamykam :D')
    }
});


async function dbFind(query = {}, sort = {}) {
    const client = new MongoClient(dbUri)
    try {
        await client.connect()

        const db = client.db(dbName)
        const collection = db.collection('products')
        const result = await collection.find(query).sort(sort).toArray()
        // const result = await collection.findOne(query)

        return result
    }
    catch (error) {
        console.error(error)
    }
    finally {
        await client.close()
        console.log('zapytanie skonczone')
    }
}

async function dbAdd(query = {}) {
    const client = new MongoClient(dbUri)

    try {
        await client.connect()

        const db = client.db(dbName)
        const collection = db.collection('products')
        const uniqueNames = await collection.find({}, { '_id': 0, 'name': 1 }).toArray()

        if (uniqueNames.includes(query.name))
            throw new Error('duplicate name')
        
        const result = await collection.insertOne(query)

        return result
    }
    catch (error) {
        console.error(error)
    }
    finally {
        await client.close()
        console.log('zapytanie skonczone')
    }
}

async function dbUpdate(query = {}, newData = {}) {
    const client = new MongoClient(dbUri)

    try {
        await client.connect()

        const db = client.db(dbName)
        const collection = db.collection('products')
        const result = await collection.updateMany(query, { '$set': newData })

        return result
    }
    catch (error) {
        console.error(error)
    }
    finally {
        await client.close()
        console.log('zapytanie skonczone')
    }
}