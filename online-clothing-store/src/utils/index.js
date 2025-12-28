const _ = require('lodash')
const { Types } = require('mongoose')

const randomImageName = () => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    return `${timestamp}_${randomStr}.jpg`
}

const removeUndefinedObject = (obj) =>
    Object.entries(obj).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null) acc[k] = v
        return acc
    }, {})

const updateNestedObjectParser = (obj) => {
    // console.log(`[1]::`, obj)

    const final = {}
    Object.keys(obj).forEach((k) => {
        const value = obj[k]
        if (typeof value === 'object' && !Array.isArray(value)) {
            const response = updateNestedObjectParser(value)
            Object.keys(response).forEach((a) => {
                final[`${k}.${a}`] = response[a]
            })
        } else {
            final[k] = value
        }
    })
    // console.log(`[2]::`, final)
    return final
}

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id)

const getInfoData = ({ fields = [], object = {} }) => {
    return _.pick(object, fields)
}

const getSelectData = (select = []) => {
    const arr = Array.isArray(select) ? select : [select] // convert string thành mảng
    return Object.fromEntries(arr.map((el) => [el, 1]))
}

const unGetSelectData = (select = []) => {
    const arr = Array.isArray(select) ? select : [select]
    return Object.fromEntries(arr.map((el) => [el, 0]))
}

const getSelectString = (select = [], unselect = []) => {
    const include = select.join(' ')
    const exclude = unselect.map((f) => `-${f}`).join(' ')
    return [include, exclude].filter(Boolean).join(' ')
}

const replacePlaceholder = (template, params) => {
    Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        template = template.replace(regex, value)
    })
    return template
}

module.exports = {
    randomImageName,
    removeUndefinedObject,
    updateNestedObjectParser,
    getInfoData,
    getSelectData,
    convertToObjectIdMongodb,
    unGetSelectData,
    getSelectString,
    replacePlaceholder,
}
