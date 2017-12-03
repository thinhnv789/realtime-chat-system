var mongoose = require('mongoose');

/**
 * Role  Mongo DB model
 * @name roleModel
 */
const roleSchema = new mongoose.Schema({
    name: {type: String},
    ident: {type: String, unique: true},
    description: {type: String},
    accounts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Account'}],
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
    status: Boolean,
}, {timestamps: true});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;