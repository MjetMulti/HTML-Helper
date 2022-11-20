/*
CONFIG
*/
const urlDict = {
    "twitch": "https://www.twitch.tv/videos/",
    "youtube": "https://youtu.be/",
    "timestamp": ""
}
const urlTimeFormatDict = {
    "twitch": function(time){
        let timeArr = padTimeNumbers(splitTimestamp(time));
        return timeArr[0] + "h" + timeArr[1] + "m" + timeArr[2] + "s";
    },
    "youtube": function(time){
        return time + "s";
    },
    "timestamp": function(time){
        let timeArr = splitTimestamp(time); // 0:00
        return ((timeArr[0] > 0) ? (timeArr[0] + ":") : "") + ((timeArr[0] > 0) ? padSingleNumber(timeArr[1]) : timeArr[1]) + ":" + padSingleNumber(timeArr[2])
        /* let timeArr = padTimeNumbers(splitTimestamp(time)); // 00:00:00
        return timeArr[0] + ":" + timeArr[1] + ":" + timeArr[2]; */
    }
}

/*
UTILITY FUNCTIONS
*/

/**
 * Splits time in seconds into houry, minutes and seconds (0000s => [h, m, s])
 * @param {number} time Time in seconds (integer)
 * @returns {Array<number>} Array of 3 integers [h,m,s]
 */
 function splitTimestamp(time) {
    let h = parseInt(time/3600);
    let m = parseInt((time - (h * 3600))/60);
    let s = time - (h * 3600 + m * 60);
    return [h, m, s]
}

/**
 * Pads numbers so they are at least 2 digits long
 * @param {Array<number>} time Array of 3 integers [1,2,3]
 * @returns Array with padded numbers [01,02,03]
 */
function padTimeNumbers(time) {
    return [String(time[0]).padStart(2,'0'),String(time[1]).padStart(2,'0'),String(time[2]).padStart(2,'0')]
}

/**
 * Pads a numbers so that it is at least 2 digits long
 * @param {Number>} time Number
 * @returns {String} the padded number
 */
function padSingleNumber(time) {
    return String(time).padStart(2,'0')
}

/**
 * Converts different time formats into seconds
 * @param {String} time time with format 00h00m00s or 0000s or 0000 or 00:00:00
 * @return {int} time in seconds (0000s) or null
 */
 function unifyTime(time) {
    let resultSum;
    let helper = time.split(/[hms:]/);
    helper = helper.filter(n => n); // Removes empty from split after 's'
    if (helper.length == 3) { // 00h00m00s or 00:00:00
        resultSum =  (parseInt((helper[0]) * 3600) + (parseInt(helper[1]) * 60) + (parseInt(helper[2])));
    }
    else { // 0000s or 0000
        resultSum = parseInt(helper[0])
    }
    if (resultSum || helper[0] === "0") {
        return resultSum
    }
    else {
        return null
    }
}

/**
 * Get provider of video links from text
 * @param {String} links Text with stream/video links in it
 * @returns {String} Site of the links (twitch|youtube|none)
 */
 function getLinkType(links) {
    if (links.includes("twitch.tv")) {
        return "twitch";
    } else if (links.includes("youtube.com") || links.includes("youtu.be")) {
        return "youtube";
    } else {
        return "none";
    }
}

/**
 * Checks if a valid link of given type is inside the text
 * @param {String} text Text to be checked for valid link
 * @param {String} type Type of link
 * @param {Boolean} captureTimestamp Return only url or url with timestamp
 * @returns {String} URL that was found or null
 */
 function checkValidURL(text, type, captureTimestamp) {
    let foundURL;
    switch (type) {
        case "twitch":
            if (captureTimestamp) {
                foundURL = text.match(/https:\/\/www\.twitch\.tv\/videos\/[0-9]+\?t=(?:[0-9]+s|[0-9]+h[0-9]+m[0-9]+s)/); // https://www.twitch.tv/videos/1605405175?t=0s OR https://www.twitch.tv/videos/1605405175?t=10h13m19s
            }
            else {
                foundURL = text.match(/https:\/\/www\.twitch\.tv\/videos\/[0-9]+/); // https://www.twitch.tv/videos/1605405175
            }
            break;
        case "youtube":
            if (captureTimestamp) {
                foundURL = text.match(/https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[0-9a-zA-Z_-]+[&\?]t=[0-9]+s?/); // https://www.youtube.com/watch?v=dQw4w9WgXcQ?t=2 OR https://youtu.be/dQw4w9WgXcQ?t=2
            }
            else {
                foundURL = text.match(/https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[0-9a-zA-Z_-]+/); // https://www.youtube.com/watch?v=dQw4w9WgXcQ OR https://youtu.be/dQw4w9WgXcQ
            }
            break;
        default:
            foundURL = null;
    }
    return foundURL ? foundURL[0] : foundURL // Returns found url or null
}

/**
 * Read and clean urls with timestamps from a textarea
 * @param {Textarea} inputTextarea The textarea from which the input is read
 * @return {Array, Array, String} Array of [vodID, time in seconds, description], Array with vod urls in order, video url provider
 */
 function readTimestampURLSFromInputTextarea(inputTextarea) {
    let timestamps = inputTextarea.value;
    let urlOrder = [];
    let type = getLinkType(timestamps);
    let deleteIdxList = [];
    if (type == "none") { // Return if no intended link is found
        return [[], [], "none"];
    }
    timestamps = timestamps.trim().split("\n"); // Split in lines
    for (let i = 0; i < timestamps.length; i++) {
        let url = checkValidURL(timestamps[i], type, true);
        if (!url) { // Skip lines without valid urls
            deleteIdxList.push(i);
            continue;
        }
        else {
            switch (type) {
                case "twitch":
                    timestamps[i] = url.replace('https://www.twitch.tv/videos/','').split("?t=").concat(timestamps[i].replace(url,'').trim().replace(/(?:^-\s|\s-$)/,"").trim());
                    break;
                case "youtube":
                    timestamps[i] = url.replace('https://www.youtube.com/watch?v=','').replace('https://www.youtu.be/','').replace('https://youtu.be/','').split(/[&\?]t=/).concat(timestamps[i].replace(url,'').trim().replace(/(?:^-\s|\s-$)/,"").trim());
                    break;
            }
            timestamps[i][1] = unifyTime(timestamps[i][1]);
            timestamps[i][3] = null;
            timestamps[i][4] = null;
            if (!urlOrder.includes(timestamps[i][0])) {
                urlOrder.push(timestamps[i][0]);
            }
        }
    }
    deleteIdxList.reverse().forEach(item => {console.log("'"+timestamps[item]+"' was deleted as invalid"); timestamps.splice(item, 1)});
    return [timestamps, urlOrder, type];
}

/**
 * Read and clean urls without timestamps from a textarea
 * @param {String} urls The string from which the input is read
 * @returns {Array, String} Array with vod urls in order, video url provider
 */
 function readNewURLSFromInput(urls) {
    let urlOrder = [];
    let type = getLinkType(urls);
    if (type == "none") { // Return if no intended link is found
        return [[], "none"];
    }
    urls = urls.trim().split("\n"); // Split in lines
    for (let i = 0; i < urls.length; i++) {
        let url = checkValidURL(urls[i], type, false);
        if (url) {
            switch (type) {
                case "twitch":
                    url = url.replace('https://www.twitch.tv/videos/','');
                    break;
                case "youtube":
                    url = url.replace('https://www.youtube.com/watch?v=','').replace('https://youtu.be/',''); // .replace('https://www.youtu.be/','') // <- Used? Not a valid url?!
                    break;
            }
            if (!urlOrder.includes(url)) {
                urlOrder.push(url);
            }
        }
    }
    return [urlOrder, type];
}

/**
 * Get Text inside a contenteditable div
 * @param {div} div Contenteditable Div
 * @return {String} content
 */
 function getContenteditableDivContent(div) {
    let content = "";
    for (const divChildNode of div.childNodes) {
        if (divChildNode.nodeType === 3) {
            content += divChildNode.nodeValue;
        }
        else if (divChildNode.nodeType === 1) {
            if (divChildNode.innerText === "") {
                continue;
            }
            else {
                content += divChildNode.innerText;
            }
        }
        if (divChildNode != div.lastChild) {
            content += "\n";
        }
    }
    return content
}
