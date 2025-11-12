const flashMessage = (req, messageType, message) => {
    req.flash(messageType + '_msg', null);
    
    switch (messageType) {
        case 'success':
            req.flash('success_msg', message);
            break;
        case 'danger':
            req.flash('error_msg', message);
            break;
        case 'error':
            req.flash('error_msg', message);
            break;
        case 'info':
            req.flash('info_msg', message);
            break;
        default:
            req.flash('info_msg', message);
    }
};

module.exports = flashMessage;