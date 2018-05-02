// Adding References on application
const fs = require("fs");
const steem = require('steem');
const rlinq = require('linq');

// This will retrive data from config.json and store on config which will use on application runtime
config = JSON.parse(fs.readFileSync("config.json"));

// This array will stores Previous Resteemed post  when application load
var preresteemed = [];

// This array will stores userlist from config file
var userlistforResteem = config.userlist;

// This array will stores userlist from config file
var taglist = config.taglist;

// This variable stores resteemby info from config file
var resteemby = config.resteemby;

// This will Retrive the Data of resteemed.json file
if (fs.existsSync('resteemed.json')) {
    const resteemed = JSON.parse(fs.readFileSync("resteemed.json"));
    if (resteemed.length) {
        // Storing resteemed Data to preresteemed which will use on application runtime
        preresteemed = resteemed;
    }
}

// This array will stores Previous Error of Resteemed when application load
var preErrorresteemed = [];
// This will Retrive the Data of resteemed.json file
if (fs.existsSync('resteemedError.json')) {
    const resteemedError = JSON.parse(fs.readFileSync("resteemedError.json"));
    if (resteemedError.length) {
        // Storing error resteemed Data to preErrorresteemed which will use on application runtime
        preErrorresteemed = resteemedError;
    }
}

// This will show notification when using
console.log('Application Initialized...');

//Calling function to Resteem Post
ConditionalResteem();

function ConditionalResteem() {
    //Storing your username from config
    var username = config.sender_account;

    //Storing your private_posting_key from config
    var wif = config.private_posting_key;

    if (resteemby == "userlist") {
        //Calling function to Resteem Post By User

        resteemPostByUser(username, wif, userlistforResteem)
    }
    else if (resteemby == "taglist") {
        //Calling function to Resteem Post By taglist
        resteemPostByTag(username, wif, taglist)

    }
}

function resteemPostByTag(username, wif, taglist) {
    console.log('Finding New Posts...');
    taglist.forEach(function (atag) {
        // This function will retrive the post of selected tags, limit parameter defines how many post you want to retrive
        steem.api.getDiscussionsByCreated({ "tag": atag, "limit": 1 }, function (err, result) {
            if (err === null) {
                for (var i = 0; i < result.length; i++) {
                    resteem(username, wif, result[0].author, result[0].permlink);
                }
            } else {
                console.log(err);
            }
        });
    });
}

function resteemPostByUser(username, wif, userlistforResteem) {
    //Creating a loop on userlist
    for (var i = 0; i < userlistforResteem.length; i++) {
        // This function will retrive the post of selected users, limit parameter defines how many post you want to retrive
        steem.api.getDiscussionsByBlog({ tag: userlistforResteem[i], limit: 1 }, function (err, result) {
            if (err === null) {
                if (result.length > 0 && IsValidPost(result[0].author, result[0].permlink)) {
                    resteem(username, wif, result[0].author, result[0].permlink);
                }
            }
        });
    }
}

function resteem(username, wif, author, permlink) {
    const json = JSON.stringify(['reblog', {
        account: username,
        author: author,
        permlink: permlink
    }]);
    steem.broadcast.customJson(wif, [], [username], 'follow', json, (reerr, reresult) => {
        if (reerr === null) {
            // calling this function to store resteem data
            saveResteemedLog(author, permlink)
            // This will show notification when using
            console.log('Resteemed Successfull !!! of Author :' + author);
        }
        else {
            // calling this function to store error of resteem data
            saveResteemedErrorLog(author, permlink, reerr)
            // This will show notification when using
            console.log('Resteeme Failed !!! of Author :' + author);
        }
    });
}


// This function will dectact that is this post is applicable for resteem
function IsValidPost(author, permlink) {
    if (resteemby == "userlist" && rlinq.from(userlistforResteem).where(x => x == author).toArray().length == 0) {
        // This will show notification when using
        console.log('Post of different author !!!');
        return false;
    }
    else if (rlinq.from(preresteemed).where(x => x.permlink == permlink).toArray().length > 0) {
        // This will show notification when using
        console.log('Already Resteemed !!!');
        return false;
    }
    else {
        return true;
    }
}

//This function will make a log for store resteemed post
function saveResteemedLog(author, permlink) {
    var aresteem = {
        author: author,
        permlink: permlink,
        transactionTime: CurrentDate()
    };
    // Adding new resteem info with previous
    preresteemed.push(aresteem);
    fs.writeFile('resteemed.json', JSON.stringify(preresteemed), function (err) {
        if (err) {
            console.log(err);
        }
    });
}

//This function will make a Error log for store Error info
function saveResteemedErrorLog(author, permlink, error) {
    var aresteem = {
        author: author,
        permlink: permlink,
        error: error.message,
        transactionTime: CurrentDate()
    };

    // Adding new resteem error info with previous
    preErrorresteemed.push(aresteem);
    fs.writeFile('resteemedError.json', JSON.stringify(preErrorresteemed), function (err) {
        if (err) {
            console.log(err);
        }
    });
}

// This function will return current date time
function CurrentDate() {
    var date = new Date()
    return date.toString();
}