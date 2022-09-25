import data from "./config.json" assert { type: 'JSON' };
console.log(data);

// Used HTML elements
var inputTextareaTwitchTimestamps;
var outputTextareaYTComment;
var outputTextareaYTURL;
var outputTextareaTwitchURL;
var outputButtonYTComment;
var outputButtonYTURL;
var outputButtonTwitchURL;
var settingsRemoveTwitchEmotesCheckbox;
var twitchURLTable;
var ytURLs;
var ytURLLinksDisplay;
var ytURLTimestampsDisplay;
var twEmoteRemoveCheck;

// Script variables
var twURLCounter = 0
var twURlistOrder = [];
var ytURlistOrder = [];
var ytURlist = {};
var twURlist = {};

var yt_url_counter = 2

window.onload = function(){
    // Used HTML elements
    inputTextareaTwitchTimestamps = document.getElementById("timestamp-input-twitch-url");
    outputTextareaYTComment = document.getElementById("timestamp-output-yt-comment");
    outputTextareaYTURL = document.getElementById("timestamp-output-yt-url");
    outputTextareaTwitchURL = document.getElementById("timestamp-output-tw-url");
    outputButtonYTComment = document.getElementById("set-timestamp-output-yt-comment");
    outputButtonYTURL = document.getElementById("set-timestamp-output-yt-url");
    outputButtonTwitchURL = document.getElementById("set-timestamp-output-tw-url");
    settingsRemoveTwitchEmotesCheckbox = document.getElementById("settings-remove-twitch-emotes")
    twitchURLTable = document.getElementById("twitch-url-table");
    ytURLs = document.getElementById("yt-url");
    ytURLLinksDisplay = document.getElementById("timestamp-output-yt-url");
    ytURLTimestampsDisplay = document.getElementById("timestamp-output-yt-comment");
    twEmoteRemoveCheck = document.getElementById("settings-remove-twitch-emotes");

    outputButtonYTComment.addEventListener("click", function(){
        setTimestampOutput("yt-comment");
    });
    outputButtonYTURL.addEventListener('click', function(){
        setTimestampOutput("yt-url");
    });
    outputButtonTwitchURL.addEventListener('click', function(){
        setTimestampOutput("tw-url");
    });
    settingsRemoveTwitchEmotesCheckbox.addEventListener('change', function(){
        convert_timestamps();
    });
    inputTextareaTwitchTimestamps.addEventListener('input', function(){
        convert_timestamps();
    });
}


// FUNCTIONS
function setTimestampOutput(method) {
    switch (method) {
        case 'yt-comment':
            outputTextareaYTComment.classList.replace("container--hidden","container--active");
            outputTextareaYTURL.classList.replace("container--active","container--hidden");
            outputTextareaTwitchURL.classList.replace("container--active","container--hidden");
            break;
        case 'yt-url':
            outputTextareaYTComment.classList.replace("container--active","container--hidden");
            outputTextareaYTURL.classList.replace("container--hidden","container--active");
            outputTextareaTwitchURL.classList.replace("container--active","container--hidden");
            break;
        case 'tw-url':
            outputTextareaYTComment.classList.replace("container--active","container--hidden");
            outputTextareaYTURL.classList.replace("container--active","container--hidden");
            outputTextareaTwitchURL.classList.replace("container--hidden","container--active");
            break;
        default:
            console.log(method);
    }
}

function populateTwitchTimestamps(urlList) {
    for (let i = 0; i < urlList.length; i++) {
        let tableRow = document.getElementById("tw-url-" + i);
        if (tableRow != null) {
            let id = document.getElementById("tw-url-id-" + i)
            id.innerHTML = urlList[i][0];
            id.setAttribute("href", "https://www.twitch.tv/videos/" + urlList[i][0]);
            document.getElementById("tw-url-time-in-" + i)
        }
        else {
            addTwitchURLTableRow(urlList[i]);
        }
    }
    let delCounter = 1;
    while (twURLCounter > urlList.length) {
        removeTwitchURLTableRow(urlList.length + delCounter);
        delCounter += 1;
    }
}

function addTwitchURLTableRow(id) {
    var newRow = document.createElement("tr");
    newRow.id = "tw-url-"+String(twURLCounter);
    newRow.innerHTML = '<td><a id="tw-url-id-'+String(twURLCounter)+'" href="https://www.twitch.tv/videos/'+id+'">'+id+'</a></td>\n<td><input id="tw-url-time-in-'+String(twURLCounter)+'"/></td>';
    twitchURLTable.appendChild(newRow);
    twURLCounter+=1;
}

function removeTwitchURLTableRow(id) {
    document.getElementById("tw-url-"+id).remove();
    twURLCounter -= 1;
}

function insert_new_yt_url() {
    yt_url_counter+=1;
    var newDiv = document.createElement("div");
    newDiv.id = "yt-url-"+String(yt_url_counter);
    newDiv.innerHTML = '<label for="yt-url-in-'+String(yt_url_counter)+'">'+String(yt_url_counter)+'</label>\n<input id="yt-url-in-'+String(yt_url_counter)+'" class="yt-url-in">\n<input id="yt-url-in-time-'+String(yt_url_counter)+'" class="yt-url-in-time">';
    ytURLs.appendChild(newDiv);
}

/**
 * Convert twitch timestamp + description into multiple formats
 */
function convert_timestamps() {

    // Workaround for empty inputs
    if (!inputTextareaTwitchTimestamps.value.trim()) {
        ytURLLinksDisplay.value = "";
        ytURLTimestampsDisplay.value = "";
        outputTextareaTwitchURL.value = "";
        return
    }

    // Split Twitch Timestamps [vodID, time in seconds, description]
    var twitchTimestamps = inputTextareaTwitchTimestamps.value.trim().split("\n"); // Split in lines
    for (let i = 0; i < twitchTimestamps.length; i++) {
        let twURL = twitchTimestamps[i].match(/https:\/\/www\.twitch\.tv\/videos\/[0-9]+\?t=(?:[0-9]+s|[0-9]+h[0-9]+m[0-9]+s)/);
        if (!twURL) { // Skip lines without twitch urls
            continue;
        }
        else {
            twitchTimestamps[i] = twURL[0].replace('https://www.twitch.tv/videos/','').split("?t=").concat(twitchTimestamps[i].replace(twURL[0],'').trim().replace(/(?:^-\s|\s-$)/,"").trim());
            twitchTimestamps[i][1] = unifyTime(twitchTimestamps[i][1])
            if (settingsRemoveTwitchEmotesCheckbox.checked) {
                twitchTimestamps[i][2] = (twitchTimestamps[i][2].replace(/:[a-zA-Z]*:/,"")).trim();
            }
            if (!twURlistOrder.includes(twitchTimestamps[i][0])) {
                twURlistOrder.push(twitchTimestamps[i][0]);
            }
        }
    }

    // Convert to different formats
    var ytLinks = "";
    var ytTimestamps = "";
    var twLinks = "";

    // Get YT urls with length
    for (let i = 1; i < yt_url_counter+1; i++) {
        let ytId = document.getElementById('yt-url-in-'+String(i)).value;
        if (ytId == "") {
            continue;
        }
        ytURlist[ytId] = unifyTime(document.getElementById('yt-url-in-time-'+String(i)).value);
        if (!ytURlistOrder.includes(ytId)) {
            ytURlistOrder.push(ytId);
        }
    }

    // Get twitch urls and times
    populateTwitchTimestamps(twURlistOrder);
    for (let i = 0; i < twURLCounter; i++) {
        twURlist[twURlistOrder[i]] = unifyTime(document.getElementById('tw-url-time-in-'+String(i)).value);
    }

    // Convert to timestamps
    var currVid = ytURlistOrder[0];
    for (let i = 0; i < twitchTimestamps.length; i++) {
        // YT with timestamped url
        let ytTime = get_yt_vid_time(make_whole_vod_time(twitchTimestamps[i]));
        if (ytTime[0]) {
            ytLinks += ytTime[0] + "?t=" + ytTime[1] + " - " + twitchTimestamps[i][2] + "\n";
        }
        // Twitch formatted with 00h00m00s
        let timeHelp = splitTimestamp(twitchTimestamps[i][1]);
        twLinks += "https://www.twitch.tv/videos/" + twitchTimestamps[i][0] + "?t=" + timeHelp[0] + "h" + timeHelp[1] + "m" + timeHelp[2] + "s" + " - " + twitchTimestamps[i][2] + "\n";
        // YT comment timestamp
        if (currVid != ytTime[0]) {
            currVid = ytTime[0];
            ytTimestamps += "\n";
        }
        let splitTime = pad_numbers(splitTimestamp(ytTime[1]));
        ytTimestamps += splitTime[0] + ":" + splitTime[1] + ":" + splitTime[2] + " - " + twitchTimestamps[i][2] + "\n";
    }
    // Display results
    ytURLLinksDisplay.value = ytLinks;
    ytURLTimestampsDisplay.value = ytTimestamps;
    outputTextareaTwitchURL.value = twLinks;
}

/**
 * Convert 00h00m00s or 0000s or 00:00:00 into 0000s 
 */
function unifyTime(time) {
    let helper;
    if (time.indexOf(":") > 0) {
        helper = time.split(":");
    }
    else {
        helper = time.split(/[hms]/);
        helper.pop(); // Removes empty from split after 's'
    }
    if (helper.length == 3) { // 00h00m00s or 00:00:00
        return (parseInt((helper[0]) * 3600) + (parseInt(helper[1]) * 60) + (parseInt(helper[2])));
    }
    else { // 0000s
        return parseInt(helper[0]);
    }
}

/**
 * 0000s => [h, m, s]
 */
function splitTimestamp(time) {
    let h = parseInt(time/3600);
    let m = parseInt((time - (h * 3600))/60);
    let s = time - (h * 3600 + m * 60);
    return [h, m, s]
}

/**
 * 0h0m0s => 00h00m00s
 */
function pad_numbers(time) {
    return [String(time[0]).padStart(2,'0'),String(time[1]).padStart(2,'0'),String(time[2]).padStart(2,'0')]
}

function make_whole_vod_time(timestamp) {
    let totalTime = 0;
    for (let i = 0; i < twURlistOrder.indexOf(timestamp[0]); i++) {
        if (twURlist[twURlistOrder[i]]) {
            totalTime += twURlist[twURlistOrder[i]];
        }
    }
    return totalTime + timestamp[1]
}

function get_yt_vid_time(time) {
    let ytURLidx = 0;
    
    while (time > ytURlist[ytURlistOrder[ytURLidx]]) {
        if (!ytURlist[ytURlistOrder[ytURLidx]]) {
            break;
        }
        time -= ytURlist[ytURlistOrder[ytURLidx]];
        ytURLidx += 1;
    }
    return [ytURlistOrder[ytURLidx], time]
}