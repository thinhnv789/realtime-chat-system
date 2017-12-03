var express = require('express');
var router = express.Router();
var Chat = require('./../controllers/Chat');

/* GET home page. */
router.get('/', Chat.getIndex);

module.exports = router;
