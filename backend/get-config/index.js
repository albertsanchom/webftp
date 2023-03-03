'use strict';

const utils = require('../utils');

exports.handler = async (event, context) => {
    var config = {};

    var cdnDomains = {};
    cdnDomains[process.env.PUBLIC_DATA_BUCKET]=process.env.PUBLIC_CDN_DOMAIN;
    cdnDomains[process.env.PROTECTED_DATA_BUCKET]=process.env.PROTECTED_CDN_DOMAIN;
    
    config["cdnDomains"]=cdnDomains;

    return utils.getResponse(null, JSON.stringify(config));
};
