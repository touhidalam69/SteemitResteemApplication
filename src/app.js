const fs = require("fs");
const steem = require('steem');
const rlinq = require('linq');

var preresteemed = [];

config = JSON.parse(fs.readFileSync("config.json"));


var userlistforResteem = config.userlist;

if (fs.existsSync('resteemed.json')) {
    const resteemed = JSON.parse(fs.readFileSync("resteemed.json"));
    if (resteemed.length) {
        preresteemed = resteemed;
    }
}

console.log('Application Initialized...');
//setInterval(resteemPost, 300000);
resteemPost();

function resteemPost() {
    var username = config.sender_account;
    var wif = config.private_posting_key;

    for (var i = 0; i < userlistforResteem.length; i++) {
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
                            console.log('Resteemed Successfull !!! of Author :' + result[0].author);
                        }
                        else {
                            console.log('Resteeme Failed !!! of Author :' + result[0].author);
                        }
                    });
                }
            }
        });
    }
}

function IsValidPost(author, permlink) {
    if (rlinq.from(userlistforResteem).where(x => x == author).toArray().length == 0) {
        console.log('Post of different author !!!');
        return false;
    }
    else if (rlinq.from(preresteemed).where(x => x.permlink == permlink).toArray().length > 0) {
        console.log('Already Resteemed !!!');
        return false;
    }
    else {
        return true;
    }
}

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

function CurrentDate() {
    var date = new Date()
    return date.toString();
}

