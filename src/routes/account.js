var express = require('express');
var router = express.Router();
var accountController = require('../controllers/Account');

/* GET account listing. */
router.get('/', accountController.getIndex);

router.get('/create', accountController.getCreate);
router.post('/create', accountController.postCreate);

router.get('/login', accountController.getLogin);
router.post('/login', accountController.postLogin);

router.get('/logout', accountController.logout)

module.exports = router;
