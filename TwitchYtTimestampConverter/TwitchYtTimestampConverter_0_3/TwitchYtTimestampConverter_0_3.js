// HTML ELEMENTS
var inputTimestampURLTextarea;
var inputNewURLTextarea;
var settingsRemoveTwitchEmotesCheckbox;


var inputURLLengthSection;
var outputURLLengthSection;
var outputURLContainer;

window.onload = function() {
    // Used HTML elements
    inputTimestampURLTextarea = document.getElementById("timestamp-input-twitch-url");
    inputNewURLTextarea = document.getElementById("new-url-input");
    settingsRemoveTwitchEmotesCheckbox = document.getElementById("settings-remove-twitch-emotes");

    outputURLContainer = document.getElementById("output-url-container");

    inputURLLengthSection = document.getElementById("input-url-length-section");
    outputURLLengthSection = document.getElementById("output-url-length-section");


    // EVENT LISTENERS

    // Remove text formatting when pasting text in contenteditable divs and spans
    let contenteditableSpans = document.querySelectorAll('span[contenteditable="true"]');
    if (contenteditableSpans) {
        for (const contenteditableSpan of contenteditableSpans) {
            contenteditableSpan.addEventListener("paste", function(e) {
                e.preventDefault();
                let unformattedText = e.clipboardData.getData("text/plain");
                // document.execCommand("insertText", false, unformattedText);
                document.execCommand("insertHTML", false, unformattedText);
            });
        }
    }
}

// SCRIPT VARIABLES
var inputTimestamps;
var timestampURLOrder = [];
var newURLOrder = [];
var timestampURLDict = {};
var newURLDict = {};
var inputURLType = "none";
var inputNewURLType = "none";

/**
 * Read and clean urls with timestamps from a textarea
 * @param {Textarea} inputTextarea The textarea from which the input is read
 * @return {Array, Array, String} Array of [vodID, time in seconds, description], Array with vod urls in order, video url provider
 */
function readTimestampURLSFromInputTextarea(inputTextarea) {
    let timestamps = inputTextarea.value;
    let urlOrder = [];
    let type = getLinkType(timestamps);
    if (type == "none") { // Return if no intended link is found
        return [], [], "none";
    }
    timestamps =timestamps.trim().split("\n"); // Split in lines
    for (let i = 0; i < timestamps.length; i++) {
        let url = checkValidURL(timestamps[i], type, true);
        if (!url) { // Skip lines without valid urls
            continue;
        }
        else {
            switch (type) {
                case "twitch":
                    timestamps[i] = url[0].replace('https://www.twitch.tv/videos/','').split("?t=").concat(timestamps[i].replace(url[0],'').trim().replace(/(?:^-\s|\s-$)/,"").trim());
                    break;
                case "youtube":
                    timestamps[i] = url[0].replace('https://www.youtube.com/watch?v=','').replace('https://www.youtu.be/','').split(/[&\?]t=/).concat(timestamps[i].replace(url[0],'').trim().replace(/(?:^-\s|\s-$)/,"").trim());
                    break;
            }
            timestamps[i][1] = unifyTime(timestamps[i][1])
            if (!urlOrder.includes(timestamps[i][0])) {
                urlOrder.push(timestamps[i][0]);
            }
        }
    }
    return [timestamps, urlOrder, type];
}

/**
 * Read and clean urls without timestamps from a textarea
 * @param {Textarea} inputTextarea The textarea from which the input is read
 * @returns {Array, String} Array with vod urls in order, video url provider
 */
function readNewURLSFromInputTextarea(inputTextarea) {
    let urls = inputTextarea.value;
    let urlOrder = [];
    let type = getLinkType(urls);
    if (type == "none") { // Return if no intended link is found
        return [], "none";
    }
    urls = urls.trim().split("\n"); // Split in lines
    for (let i = 0; i < urls.length; i++) {
        let url = checkValidURL(urls[i], type, false);
        if (url && !urlOrder.includes(url)) {
            urlOrder.push(url);
        }
    }
    return [urlOrder, type];
}

/**
 * Get provider of video links on the test
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
 * @returns 
 */
function checkValidURL(text, type, hasTimestamp) {
    switch (type) {
        case "twitch":
            if (hasTimestamp) {
                return text.match(/https:\/\/www\.twitch\.tv\/videos\/[0-9]+\?t=(?:[0-9]+s|[0-9]+h[0-9]+m[0-9]+s)/);
            }
            return text.match(/https:\/\/www\.twitch\.tv\/videos\/[0-9]+/);
        case "youtube":
            if (hasTimestamp) {
                return text.match(/https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[0-9a-zA-Z_]+[&\?]t=[0-9]+s?/);
            }
            return text.match(/https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[0-9a-zA-Z_]/);
        default:
            return null;
    }
}

function setInputVideoLengthLinks() {

}

function filterDescriptionText() {
    /* if (settingsRemoveTwitchEmotesCheckbox.checked) {
                timestamps[i][2] = (timestamps[i][2].replace(/:[a-zA-Z]*:/,"")).trim();
            } */
    return null;
}

function clearOutput() {
    
}

function addURLArea(parentContainer, urlID, isInputPrefix) {
    var newArea = document.createElement("div");
    newArea.classList = ["url-video-area"];
    let areaID = isInputPrefix + "url-video-area-" + String(urlID);
    newArea.id = areaID;
    parentContainer.appendChild(newArea);
    return areaID;
}

function addURLToArea(url, area) {

}

function convertTimestamps() {
    // TODO Twitch yt vod times
    [inputTimestamps, timestampURLOrder, inputURLType] = readTimestampURLSFromInputTextarea(inputTimestampURLTextarea);
    [newURLOrder, inputNewURLType] = readNewURLSFromInputTextarea(inputNewURLTextarea);

    for (const inputURL of timestampURLOrder) {
        if ((inputURL in timestampURLDict) && ("areaID" in timestampURLDict[inputURL])) {
            true; // ADD LINKS
        } else {
            if (!(inputURL in timestampURLDict)) {
                timestampURLDict[inputURL] = {}
            }
            timestampURLDict[inputURL].areaID = addURLArea(outputURLContainer, inputURL, "timestamp-");
        }
    }
}

// UTIL FUNCTIONS

/**
 * Converts different time formats into seconds
 * @param {String} time time with format 00h00m00s or 0000s or 0000 or 00:00:00
 * @return {int} time in seconds (0000s)
 */
function unifyTime(time) {
    let helper = time.split(/[hms:]/);
    helper.filter(n => n); // Removes empty from split after 's'
    if (helper.length == 3) { // 00h00m00s or 00:00:00
        return (parseInt((helper[0]) * 3600) + (parseInt(helper[1]) * 60) + (parseInt(helper[2])));
    }
    else { // 0000s or 0000
        return parseInt(helper[0]);
    }
}




/* 
var outputTextareaYTComment;
var outputTextareaYTURL;
var outputTextareaTwitchURL;
var outputButtonYTComment;
var outputButtonYTURL;
var outputButtonTwitchURL;

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

var yt_url_counter = 2 */

/* window.onload = function(){
    
    outputTextareaYTComment = document.getElementById("timestamp-output-yt-comment");
    outputTextareaYTURL = document.getElementById("timestamp-output-yt-url");
    outputTextareaTwitchURL = document.getElementById("timestamp-output-tw-url");
    outputButtonYTComment = document.getElementById("set-timestamp-output-yt-comment");
    outputButtonYTURL = document.getElementById("set-timestamp-output-yt-url");
    outputButtonTwitchURL = document.getElementById("set-timestamp-output-tw-url");
    
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
} */


// FUNCTIONS
/* function setTimestampOutput(method) {
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
} */

/* function populateInputURLTable(urlList) {
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
} */

/* function addTwitchURLTableRow(id) {
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
} */



/**
 * Convert twitch timestamp + description into multiple formats
 */
/* function convert_timestamps() {
 */
    // Workaround for empty inputs
/*     if (!inputTextareaTwitchTimestamps.value.trim()) {
        ytURLLinksDisplay.value = "";
        ytURLTimestampsDisplay.value = "";
        outputTextareaTwitchURL.value = "";
        return
    } */

    ////////////////////////////////////

    // Convert to different formats
/*     var ytLinks = "";
    var ytTimestamps = "";
    var twLinks = ""; */

    // Get YT urls with length
/*     for (let i = 1; i < yt_url_counter+1; i++) {
        let ytId = document.getElementById('yt-url-in-'+String(i)).value;
        if (ytId == "") {
            continue;
        }
        ytURlist[ytId] = unifyTime(document.getElementById('yt-url-in-time-'+String(i)).value);
        if (!ytURlistOrder.includes(ytId)) {
            ytURlistOrder.push(ytId);
        }
    } */

    // Get twitch urls and times
/*     populateTwitchTimestamps(twURlistOrder);
    for (let i = 0; i < twURLCounter; i++) {
        twURlist[twURlistOrder[i]] = unifyTime(document.getElementById('tw-url-time-in-'+String(i)).value);
    } */

    // Convert to timestamps
/*     var currVid = ytURlistOrder[0];
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
} */



/**
 * 0000s => [h, m, s]
 */
/* function splitTimestamp(time) {
    let h = parseInt(time/3600);
    let m = parseInt((time - (h * 3600))/60);
    let s = time - (h * 3600 + m * 60);
    return [h, m, s]
} */

/**
 * 0h0m0s => 00h00m00s
 */
/* function pad_numbers(time) {
    return [String(time[0]).padStart(2,'0'),String(time[1]).padStart(2,'0'),String(time[2]).padStart(2,'0')]
} */

/* function make_whole_vod_time(timestamp) {
    let totalTime = 0;
    for (let i = 0; i < twURlistOrder.indexOf(timestamp[0]); i++) {
        if (twURlist[twURlistOrder[i]]) {
            totalTime += twURlist[twURlistOrder[i]];
        }
    }
    return totalTime + timestamp[1]
} */

/* function get_yt_vid_time(time) {
    let ytURLidx = 0;
    
    while (time > ytURlist[ytURlistOrder[ytURLidx]]) {
        if (!ytURlist[ytURlistOrder[ytURLidx]]) {
            break;
        }
        time -= ytURlist[ytURlistOrder[ytURLidx]];
        ytURLidx += 1;
    }
    return [ytURlistOrder[ytURLidx], time]
} */

// Remove text formatting when pasting text in contenteditable divs and spans
/* let contenteditableDiv = document.querySelector('div[contenteditable="true"]');
let contenteditableSpans = document.querySelectorAll('span[contenteditable="true"]');

if (contenteditableDiv) {
    contenteditableDiv.addEventListener("paste", function(e) {
        e.preventDefault();
        let unformattedText = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, unformattedText);    // Keeps line breaks
        // document.execCommand("insertHTML", false, unformattedText); // Only keeps COMPLETELY unformatted text
    });
}
if (contenteditableSpans) {
    for (const contenteditableSpan of contenteditableSpans) {
        contenteditableSpan.addEventListener("paste", function(e) {
            e.preventDefault();
            let unformattedText = e.clipboardData.getData("text/plain");
            // document.execCommand("insertText", false, unformattedText);
            document.execCommand("insertHTML", false, unformattedText);
        });
    }
} */

// TEST DATA
/* 
STREAM RECAP 9/30/22

https://www.twitch.tv/videos/1605405175?t=0s - waking up and sharing about helping Serge (his home was destroyed by Hurricane Ian :rBeesadge:
https://www.twitch.tv/videos/1605405175?t=941s - picking up Lulu at the vault and ran into Steven and Finn. :rBeeHuggies:
https://www.twitch.tv/videos/1605405175?t=1538s - checking out Lulu’s home while Lulu changes clothes 🏘️
https://www.twitch.tv/videos/1605405175?t=1848s - Training Lulu for K9 vet treatments 🦮
https://www.twitch.tv/videos/1605405175?t=2051s -Talking with Odessa :rBeeHuggies:
https://www.twitch.tv/videos/1605405175?t=2581s - Lulu does a k9 vet appointment for Dingo (Luka’s K9) 🦮
https://www.twitch.tv/videos/1605405175?t=3300s - Dark arrives to be the one to be attacked by Dingo :rBeeKEKW:
https://www.twitch.tv/videos/1605405175?t=4670s - call from Maddie regarding something Maddie is investigating :amrainPhone:
https://www.twitch.tv/videos/1605405175?t=5300s - going to city hall to check if a certain car is Norman’s :rBeeCrowHug:
https://www.twitch.tv/videos/1605405175?t=5930s - dropping off Lulu and going to Shrugway 🥪
https://www.twitch.tv/videos/1605405175?t=6248s - finding out about a new storefront that will be selling things you can actually throw amrainBonk
https://www.twitch.tv/videos/1605405175?t=6550s - talking to Atten Dant about him running for mayor :amrainHmm:
https://www.twitch.tv/videos/1605405175?t=7405s - hanging out with ems friends at viceroy :rBeeHuggies:
https://www.twitch.tv/videos/1605405175?t=7820s - talk with Tommy regarding Norman, Highway man, Pez’s financé, and marriage :amrainHmm:
https://www.twitch.tv/videos/1605405175?t=8820s - Balto joins in the convo. :rBeeHuggies:
https://www.twitch.tv/videos/1605405175?t=10880s - waking up after storm, running errands :rBeeKikiWiggle2:
https://www.twitch.tv/videos/1605405175?t=12942s - stinky bodon is back! :rBeeBodon:
https://www.twitch.tv/videos/1605405175?t=13372s - phone call from Tommy, Tommy is cooked af :PepeLaffing:
https://www.twitch.tv/videos/1605405175?t=13970s - hanging out with ems off duty, riding along with them too. :rQueenBeeHug:
https://www.twitch.tv/videos/1605405175?t=16882s - Dodo with V. :rBeeDodo:
https://www.twitch.tv/videos/1605405175?t=5h53m7s - trying to get a group for sanitation :rBeeHmmm:
https://www.twitch.tv/videos/1605405175?t=6h49m27s - playing with colors for Patrick's car :rBeehappy: 
https://www.twitch.tv/videos/1605405175?t=7h9m2s - chilling at the courthouse before the deposition (did not happen then):rBeeLUL: 
https://www.twitch.tv/videos/1605405175?t=7h37m9s - hanging out with V and Patrick :rBeehappy: 
https://www.twitch.tv/videos/1605405175?t=8h10m29s - going to shits & giggles then the hospital and Jeffy joins :rBeeStaticCheer:
https://www.twitch.tv/videos/1605405175?t=9h12m38s - giving patrick a tour of the firehouse :rBeepoHappy:
https://www.twitch.tv/videos/1605405175?t=9h20m40s - going to Viceroy :amrainCozywebs~1:  and seeing Hope :rBeeUWU: then driving around at the sandy airfield :rBeeWicked:
https://www.twitch.tv/videos/1605405175?t=9h44m11s - back to the courthouse for the deposition SPOILER ALERT: it doesn't happen :rBeeLUL:
https://www.twitch.tv/videos/1605405175?t=10h13m19s - talking with Lenmom and Jeffy then Pixie about Norman and purgatory and such :rBeeHmmm:
 */

/* 
VOD for 9/30 on  :YouTube: 
https://youtu.be/viDx9FQej7U 
*/
