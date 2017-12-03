const socket = io('http://localhost:2201');
// const adminSocket = io('/admin');

socket.on('connect', () => {
    let data = localStorage.getItem('account');

    data = data ? JSON.parse(data) : null;

    createNewChatBox();

    /**
     * Client join chat
     */
    socket.emit('client_join_chat', data);

    /**
     * Get identify from server and save to local storage
     */
    socket.on('client_identifier', (data) => {
        localStorage.setItem('account', JSON.stringify(data));
    })

    /**
     * Event receive message from server
     */
    socket.on('owner_message', (data) => {
        let messEl = document.createElement('li');
        messEl.textContent = data.messageContent;
        
        /**
         * Append message to box content
         */
        let boxContent = document.getElementById('chat-box-content');
        if (boxContent) {
            boxContent.appendChild(messEl);
        }

        /**
         * set partner
         */
        // let sendMessBtn = document.getElementById('client_send_message');
        // sendMessBtn.setAttribute('to', data.to);
    })

    /**
     * Event receive message from server
     */
    socket.on('message', (data) => {
        console.log('receive mess', data);
        let messEl = document.createElement('li');
        messEl.textContent = data.messageContent;
        
        /**
         * Append message to box content
         */
        let boxContent = document.getElementById('chat-box-content');
        if (boxContent) {
            boxContent.appendChild(messEl);
        }

        /**
         * set partner
         */
        // let sendMessBtn = document.getElementById('client_send_message');
        // sendMessBtn.setAttribute('to', data.sender.room);
    });

    /**
     * Client send message to customer care
     */
    let sendMessBtn = document.getElementById('send-message');
    
    if (sendMessBtn) {
        sendMessBtn.onclick = function(e) {
            let messageContent = document.getElementById('message-input');

            if (messageContent) {
                let value = messageContent.value;
                let sender = localStorage.getItem('account'), dataSend = {};
    
                if (value && sender) {
                    /**
                     * Case existing user
                     */
                    sender = JSON.parse(sender);
    
                    dataSend = {
                        sender: sender,
                        to: 'room_customer_care',
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

    /**
     * Event Enter
     */

});

function createNewChatBox() {
    /**
     * Declare variables
     */
    const boxWidth = 280,
        boxHeight = 350,
        boxHeaderHeight = 28,
        boxFooterHeight = 68,
        boxContentHeight = 254;

    let chatBox = document.createElement('div');
    chatBox.className = 'chat-box';
    chatBox.style = 'width: ' + boxWidth + 'px; height: ' + boxHeight
                    + 'px; position: fixed; z-index: 9999; bottom: 0; right: 15px; '
                    + 'background: #ccc; border: 1px solid #ddd; border-top-left-radius: 5px;'
                    + 'border-top-right-radius: 5px;';

    /**
     * create chat box header
     */
    let chatBoxHeader = document.createElement('div');
    chatBoxHeader.className = 'chat-box-header';
    chatBoxHeader.style = 'background-color: #f5f5f5; border-color: #ddd; height: '
                        + boxHeaderHeight + 'px; padding: 0 15px; border-top-left-radius: 5px; border-top-right-radius: 5px;';
    chatBox.appendChild(chatBoxHeader);
    

    let boxHeaderInfo = document.createElement('div');
    boxHeaderInfo.className = 'box-header-info';
    boxHeaderInfo.style = 'display: inline-block;';
    chatBoxHeader.appendChild(boxHeaderInfo);

    let boxTitle = document.createElement('div');
    boxTitle.className = 'box-title';
    boxTitle.style = 'height: ' + boxHeaderHeight + 'px; line-height: ' + boxHeaderHeight + 'px'; 
    boxTitle.textContent = 'Hello World';
    boxHeaderInfo.appendChild(boxTitle);

    let headerToolbar = document.createElement('div');
    headerToolbar.className = 'box-header-toolbar';
    headerToolbar.style = 'display: inline-block; cursor: pointer; position: absolute; right: 15px;';
    chatBoxHeader.appendChild(headerToolbar);

    let hideBox = document.createElement('span');
    hideBox.className = 'hide-box';
    hideBox.style = 'width: 12px; height: 10px; margin-top: ' + (boxHeaderHeight - 10) / 2 + 'px; margin-right: 8px; display: inline-block;'
                + ' background: url(https://static-v.tawk.to/a-v3-39/images/icons.png); background-position: -32px 0;'; 
    // hideBox.textContent = '-';
    headerToolbar.appendChild(hideBox);

    let closeBox = document.createElement('span');
    closeBox.className = 'close-box';
    closeBox.style = 'width: 12px; height: 12px; margin-top: ' + (boxHeaderHeight - 12) / 2 + 'px; display: inline-block;'
                    + ' background: url(https://static-v.tawk.to/a-v3-39/images/icons.png)'; 
    // closeBox.textContent = '+';
    headerToolbar.appendChild(closeBox);
    

    /**
     * Create chat box content
     */
    let chatBoxContent = document.createElement('div');
    chatBoxContent.className = 'chat-box-content';
    chatBoxContent.id = 'chat-box-content';
    chatBoxContent.style = 'height: ' + boxContentHeight + 'px; background: #e5e5e5; overflow-y: scroll;';
    chatBox.appendChild(chatBoxContent);

    /**
     * Create chat box footer
     */
    let chatBoxFooter = document.createElement('div');
    chatBoxFooter.className = 'chat-box-footer';
    chatBox.appendChild(chatBoxFooter);

    let mainFooterContainer = document.createElement('div');
    mainFooterContainer.className = 'main-footer-container';
    mainFooterContainer.style = 'height: ' + boxFooterHeight/2 + 'px';
    chatBoxFooter.appendChild(mainFooterContainer);

    let inputMessage = document.createElement('textarea');
    inputMessage.className = 'message-input';
    inputMessage.id = 'message-input';
    inputMessage.style = 'width: ' + (boxWidth - 62) + 'px;height: ' + boxFooterHeight/2 + 'px; '
                        + '; box-sizing: border-box;';
                        inputMessage.onkeydown = function(e) {
        var code = e.keyCode ? e.keyCode : e.which;
        if (code == 13 && !e.shiftKey) {  // Enter keycode
            let sendMessBtn = document.getElementById('send-message');
            sendMessBtn.click();
            return false;
        }
    }
    mainFooterContainer.appendChild(inputMessage);

    let btnSend = document.createElement('button');
    btnSend.className = 'send-message';
    btnSend.id = 'send-message';
    btnSend.style = 'width: 62px; box-sizing: border-box; vertical-align: top;';
    btnSend.textContent = 'Send';
    mainFooterContainer.appendChild(btnSend);

    document.body.appendChild(chatBox);
}