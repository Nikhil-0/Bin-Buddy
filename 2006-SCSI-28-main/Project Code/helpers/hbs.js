module.exports = {
    formatDate: function(date, format) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    formatTime: function(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    },
    
    isPastDue: function(date) {
        return new Date(date) < new Date();
    },
    
    eq: function(v1, v2) {
        return v1 === v2;
    },
    
    ne: function(v1, v2) {
        return v1 !== v2;
    },
    
    gt: function(v1, v2) {
        return v1 > v2;
    },
    
    lt: function(v1, v2) {
        return v1 < v2;
    },
    
    add: function(v1, v2) {
        return v1 + v2;
    },
    
    subtract: function(v1, v2) {
        return v1 - v2;
    },
    
    contains: function(arr, value) {
        if (!arr) return false;
        return arr.includes(value);
    },

    json: function(context) {
        return JSON.stringify(context);
    },

    when: function(operand_1, operator, operand_2, options) {
        let operators = {
            'eq': function(l,r) { return l == r; },
            'noteq': function(l,r) { return l != r; },
            'gt': function(l,r) { return Number(l) > Number(r); },
            'lt': function(l,r) { return Number(l) < Number(r); },
            'gteq': function(l,r) { return Number(l) >= Number(r); },
            'lteq': function(l,r) { return Number(l) <= Number(r); }
        }
        let result = operators[operator](operand_1, operand_2);
        
        if (result) return options.fn(this);
        else return options.inverse(this);
    }
};
