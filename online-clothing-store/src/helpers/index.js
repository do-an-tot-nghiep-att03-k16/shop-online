const isAdmin = (role) => {
    return role === 'admin' || role === 'shop'
}

module.exports = { isAdmin }
