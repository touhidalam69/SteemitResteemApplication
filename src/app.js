// Adding References on application
const fs = require("fs");
const steem = require('steem');
const rlinq = require('linq');

// This will retrive data from config.json and store on config which will use on application runtime
config = JSON.parse(fs.readFileSync("config.json"));

// This array will stores userlist from config file
var userlistforResteem = config.userlist;

// This array will stores Previous Resteemed post  when application load
var preresteemed = [];

// This will Retrive the Data of resteemed.json file
if (fs.existsSync('resteemed.json')) {
    const resteemed = JSON.parse(fs.readFileSync("resteemed.json"));
    if (resteemed.length) {
        // Storing resteemed Data to preresteemed which will use on application runtime
        preresteemed = resteemed;
    }
}

// This will show notification when using
console.log('Application Initialized...');

//Calling function to Resteem Post
resteemPost();

function resteemPost() {
    //Storing your username from config
    var username = config.sender_account;

    //Storing your private_posting_key from config
    var wif = config.private_posting_key;

    //Creating a loop on userlist
    for (var i = 0; i < userlistforResteem.length; i++) {
        // This function will retrive the post of selected users, limit parameter defines how many post you want to retrive
        steem.api.getDiscussionsByBlog({ tag: userlistforResteem[i], limit: 1 }, function (err, result) {
            if (err === null) {
                if (result.length > 0 && IsValidPost(result[0].author, result[0].permlink)) {
                    const json = JSON.stringify(['reblog', {
                        account: username,
                        author: result[0].author,
                        permlink: result[0].permlink
                    }]);
                    steem.broadcast.customJson(wif, [], [username], 'follow', json, (reerr, reresult) => {
                        if (reerr === null) {
                            saveResteemedLog(result[0].author, result[0].permlink)
                            // This will show notification when using
                            console.log('Resteemed Successfull !!! of Author :' + result[0].author);
                        }
                        else {
                            // This will show notification when using
                            console.log('Resteeme Failed !!! of Author :' + result[0].author);
                        }
                    });
                }
            }
        });
    }
}

// This function will dectact that is this post is applicable for resteem
function IsValidPost(author, permlink) {
    if (rlinq.from(userlistforResteem).where(x => x == author).toArray().length == 0) {
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

    preresteemed.push(aresteem);
    fs.writeFile('resteemed.json', JSON.stringify(preresteemed), function (err) {
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