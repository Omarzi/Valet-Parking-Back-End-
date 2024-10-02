const moment = require('moment');

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD h:mm A');
};

module.exports = formatDate;
