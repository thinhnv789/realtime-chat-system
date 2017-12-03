const socket = io();
// const adminSocket = io('/admin');

socket.on('connect', () => {
    socket.emit(
        'account_info',
        { 
            userName: 'admin',
            email: 'admin@gmail.com',
            password: '123456'
        }
    );
     /**
     * Event receive message from server
     */
    socket.on('owner_message', (data) => {
        let messEl = document.createElement('li');
        messEl.textContent = data.messageContent;
        document.body.appendChild(messEl);
    });
    
    /**
     * Event receive message from server
     */
    socket.on('message', (data) => {
        let messEl = document.createElement('li');
        messEl.textContent = data.messageContent;
        document.body.appendChild(messEl);

        /**
         * set partner
         */
        let sendMessBtn = document.getElementById('admin_send_message');
        sendMessBtn.setAttribute('to', data.sender.room);
    });

    /**
     * Admin send message to customer care
     */
    let sendMessBtn = document.getElementById('admin_send_message');
    if (sendMessBtn) {
        sendMessBtn.onclick = function(e) {
            let messageContent = document.getElementById('message_content');
            if (messageContent) {
                let value = messageContent.value;
                let sender = {
                    room: 'room_customer_care',
                    userName: 'admin',
                    email: 'admin@gmail.com'
                };
                let to = sendMessBtn.getAttribute('to');
    
                if (value && to) {
                    dataSend = {
                        sender: sender,
                        to: to,
                        messageContent: value
                    }
    
                    socket.emit('send_message', dataSend)
                    /**
                     * reset value after sent
                     */
                    messageContent.value = '';
                } else {
                    /**
                     * Case not existing user
                     */
                }
            }
        }
    }
});