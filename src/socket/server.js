const User = require('./../models/User');
const Room = require('./../models/Room');

var ioEvents = function(io) {
    // const adminNamespace = io.of('/admin');
    io.on('connection', function(socket){
        /**
         * Event for admin join chat
         */
        socket.on('account_info', function(data) {
            User.findOne({userName: data.userName}).exec(function (err, user) {
                if (err) {
                    console.log('err', err)
                    return done(err);
                }
                
                if (user) {
                    /**
                     * Change socket id was generated by server to user Id
                     */
                    let uRoom = 'room_' + user.id, customerCareRoom = 'room_customer_care';
                    /**
                     * Join this room: using case 1 account login in many device
                     */
                    socket.join(uRoom);
                    /**
                     * Join customer care room in order to reply customer's messages
                     */
                    socket.join(customerCareRoom);

                    io.to(uRoom).emit('test_mess', 'tttttttttttttt');
                } else {
                    /**
                     * create new user
                     */
                    var user = new User();
                    user.userName = data.userName;
                    user.phoneNumber = '01626878789';
                    user.email = data.email;
                    user.password = data.password;

                    user.save(function(err) {
                        if (err) {
                            console.log('err', err);
                        } 
                        /**
                         * Change socket id was generated by server to user Id
                         */
                        let uRoom = 'room_' + user.id, customerCareRoom = 'room_customer_care';
                        /**
                         * Join this room: using case 1 account login in many device
                         */
                        socket.join(uRoom);
                        /**
                         * Join customer care room in order to reply customer's messages
                         */
                        socket.join(customerCareRoom);
                    })
                }
            });
        });

        /**
         * Event for client join chat
         */
        socket.on('client_join_chat', (data) => {
            if (data) {
                User.findOne({userName: data.userName}).exec(function (err, user) {
                    if (err) {
                        console.log('err', err)
                        return done(err);
                    }

                    if (user) {
                        let uRoom = 'room_' + user.id;
                        socket.join(uRoom);
                    } else {
                        /**
                         * gen uuid 
                         */
                        let genUserName = null, newUser;
                        genUserName = 'u_' + new Date().getTime();
                        
                        newUser = new User();
                        newUser.userName = genUserName;
                        newUser.phoneNumber = '01626878789';
                        newUser.email = genUserName + '@gmail.com';
                        newUser.password = '123456';
                        newUser.save((err) => {
                            if (err) {
                                console.log('err', err);
                            } else {
                                let uRoom = 'room_' + newUser.id;
                                socket.join(uRoom);

                                socket.emit('client_identifier', {
                                    room: 'room_' + newUser.id,
                                    userName: newUser.userName,
                                    email: newUser.email
                                })
                            }
                        });
                    }
                });
            } else {
                /**
                 * gen uuid 
                 */
                let genUserName = null, newUser;
                genUserName = 'u_' + new Date().getTime();
                
                newUser = new User();
                newUser.userName = genUserName;
                newUser.phoneNumber = '01626878789';
                newUser.email = genUserName + '@gmail.com';
                newUser.password = '123456';
                newUser.save((err) => {
                    if (err) {
                        console.log('err', err);
                    } else {
                        let uRoom = 'room_' + newUser.id;
                        socket.join(uRoom);
                        socket.emit('client_identifier', {
                            room: 'room_' + newUser.id,
                            userName: newUser.userName,
                            email: newUser.email
                        })
                    }
                });
            }
        });

        /**
         * Event send message
         */
        socket.on('send_message', (data) => {
            /**
             * Send message to sender
             */
            io.to(data.sender.room).emit('owner_message', data);

            /**
             * Send message to recipient
             */
            
            io.to(data.to).emit('message', data);
        })
        /**
         * Event client disconnect
         */
        socket.on('disconnect', () => {
            console.log('reason');
        });
    });
}

module.exports = ioEvents;