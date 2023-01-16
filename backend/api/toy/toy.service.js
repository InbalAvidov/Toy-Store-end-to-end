const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy) {
    if (filterBy.inStock === 'true') filterBy.inStock = true
    if (filterBy.inStock === 'false') filterBy.inStock = false
    try {
        const criteria = {
            name: { $regex: filterBy.name, $options: 'i' },
        }
        if (filterBy.label.length > 0) criteria.labels = { $in: filterBy.label.split(',') }
        if (filterBy.inStock) criteria.inStock = filterBy.inStock
        const collection = await dbService.getCollection('toy')
        var toys = await collection.find(criteria).toArray()
        if (filterBy.sort === 'name') {
            toys = toys.sort((a, b) => a.name.localeCompare(b.name))
        }
        else if (filterBy.sort === 'old') {
            toys = toys.sort((a, b) => a.createdAt - b.createdAt)
        }
        else if (filterBy.sort === 'new') {
            toys = toys.sort((a, b) => b.createdAt - a.createdAt)
        }
        else if (filterBy.sort === 'min-price') {
            toys = toys.sort((a, b) => a.price - b.price)
        }
        else if (filterBy.sort === 'max-price') {
            toys = toys.sort((a, b) => b.price - a.price)
        }
        return toys
    } catch (err) {
        logger.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const toy = collection.findOne({ _id: ObjectId(toyId) })
        return toy
    } catch (err) {
        logger.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: ObjectId(toyId) })
        return toyId
    } catch (err) {
        logger.error(`cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        logger.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    console.log('toy:', toy)
    try {
        const toyToSave = {
            name: toy.name,
            price: toy.price,
            labels: toy.labels,
            inStock: toy.inStock
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId(toy._id) }, { $set: toyToSave })
        return toy
    } catch (err) {
        logger.error(`cannot update toy `, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        console.log('msg:',msg)
        const msgToSave = {
            ...msg,
            by: {
                fullname: msg.by.fullname,
                _id: msg.by._id
            }
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId(toyId) }, { $push: { msgs: msgToSave } })
        return msgToSave
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId(toyId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
    addToyMsg,
    removeToyMsg
}
