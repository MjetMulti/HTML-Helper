// HTML ELEMENTS
var inputTimestampURLTextarea;
var inputNewURLTextarea;
var settingsRemoveTwitchEmotesCheckbox;


var inputURLLengthSection;
var outputURLLengthSection;
var outputURLContainer;

var targetURLLengthDiv;
var targetURLLengthDisplay;
var targetURLLengthEditButton;
var originURLLengthMessage;
var originURLLengthDisplay;

var urlTargetContainer;
var convertTimestampDisplayButton;

var urlControlButtons;
var controlButtonsSetManually = false;

var ytPlayerContainer;

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
        let timeArr = padTimeNumbers(splitTimestamp(time));
        return timeArr[0] + ":" + timeArr[1] + ":" + timeArr[2];
    }
}

// SCRIPT VARIABLES
var inputTimestamps; // Array of origin timestamps [[originVideoId, originTimestamp, description, targetVideoId, targetTimestamp],[...]]
var originURLOrder = []; // Array of origin video IDs [videoId1, videoId2, ...]
var targetURLOrder = []; // Array of target video IDs [videoId1, videoId2, ...]
var timestampURLDict = {}; // Dictionary with videoId data {"videoId": {"areaID": AreaDivId}}
var newURLDict = {};
var originURLType = "none";
var targetURLType = "none";
var originVideoData = {};


var editmodeOn = false;
var urlOutputType = "target-timestamp";

var ytAPIInit = false;

window.onload = function() {
    // Used HTML elements
    inputTimestampURLTextarea = document.getElementById("timestamp-input-twitch-url");
    inputNewURLTextarea = document.getElementById("new-url-input");
    settingsRemoveTwitchEmotesCheckbox = document.getElementById("settings-remove-twitch-emotes");

    inputURLLengthSection = document.getElementById("input-url-length-section");
    outputURLLengthSection = document.getElementById("output-url-length-section");

    targetURLLengthDiv = document.getElementById("url-length-target-input");
    targetURLLengthDisplay = document.getElementById("url-length-target-display");
    targetURLLengthEditButton = targetURLLengthDiv.parentElement.querySelector('header button');
    originURLLengthMessage = document.getElementById("url-length-origin-message");
    originURLLengthDisplay = document.getElementById("url-length-origin-display");
    convertTimestampDisplayButton = document.getElementById("convert-timestamp-display-button");

    urlTargetContainer = document.getElementById("url-target-container");

    urlControlButtons = document.querySelectorAll("button[data-toggle]");

    ytPlayerContainer = document.getElementById("yt-player-container");
    // initilizeYoutubeIFrameAPI();

    // EVENT LISTENERS

    // Remove text formatting when pasting text in contenteditable divs and spans
    let contenteditableSpans = document.querySelectorAll('span[contenteditable="true"]');
    if (contenteditableSpans) {
        for (const contenteditableSpan of contenteditableSpans) {
            contenteditableSpan.addEventListener("paste", contenteditableSpanEventListener);
        }
    }
    let contenteditableDivs = document.querySelectorAll('div[contenteditable="true"]');
    if (contenteditableDivs) {
        for (const contenteditableDiv of contenteditableDivs) {
            contenteditableDiv.addEventListener("paste", function(e) {
                e.preventDefault();
                let unformattedText = e.clipboardData.getData("text/plain");
                document.execCommand("insertText", false, unformattedText);    // Keeps line breaks
                // document.execCommand("insertHTML", false, unformattedText); // Only keeps COMPLETELY unformatted text
            });
            contenteditableDiv.addEventListener("keyup", function(e) {
                if (contenteditableDiv.innerText === '\n') {
                    contenteditableDiv.innerHTML = ''
                }
            });
        }
    }

    targetURLLengthDiv.addEventListener("focusout", function(event) {
        let inURLs = getContenteditableDivContent(targetURLLengthDiv);
        targetURLOrder = [];
        targetURLType = "none";
        if (inURLs !== "") {
            [targetURLOrder, targetURLType] = readNewURLSFromInput(inURLs);
            if (targetURLOrder.length > 0) {
                targetURLLengthDiv.style.display = "none";
                targetURLLengthDisplay.style.display = "grid";
                targetURLLengthEditButton.parentElement.style.display = "grid";
                targetURLLengthEditButton.style.display = "block";
                fillURLLengthDisplay(targetURLLengthDisplay, targetURLType, targetURLOrder, {});
            }
        }
    });

    targetURLLengthEditButton.addEventListener("click", function(event) {
        targetURLLengthDiv.style.display = "block";
        targetURLLengthDisplay.style.display = "none";
        targetURLLengthEditButton.parentElement.style.display = "block";
        targetURLLengthEditButton.style.display = "none";
    });

    /* window.addEventListener("keydown", function(e){
        if (e.key == "Control") {
            editmodeOn = true; */
            /* let contenteditableSpans = document.querySelectorAll('span[contenteditable="true"]');
            if (contenteditableSpans) {
                for (const contenteditableSpan of contenteditableSpans) {
                    contenteditableSpan.setAttribute("contenteditable", "true");
                }
            } */
        /* }
    }); */
    /* window.addEventListener("keyup", function(e){
        if (e.key == "Control") {
            editmodeOn = false;
        }
    }); */
}

function contenteditableSpanEventListener(e) {
    e.preventDefault();
    let unformattedText = e.clipboardData.getData("text/plain");
    // document.execCommand("insertText", false, unformattedText);
    document.execCommand("insertHTML", false, unformattedText);
}

/**
 * Set the output type of the urls
 * @param {String} urlControl (target-timestamp|target-url|origin-timestamp|origin-url) String
 */
 function setURLOutput(urlControl, manuallySet) {
    if (manuallySet || controlButtonsSetManually === manuallySet) {
        if (manuallySet) {
            controlButtonsSetManually=manuallySet;
        }
        urlOutputType = urlControl;
        let selectedButton = document.getElementById("url-control-button-"+urlControl);
        for (const urlControlButton of urlControlButtons) {
            if (urlControlButton == selectedButton) {
                urlControlButton.setAttribute("data-toggle", "true");
            }
            else {
                urlControlButton.setAttribute("data-toggle", "false");
            }
        }
        updateTimestampDisplay();
    }
}


// URL LENGTH

/**
 * 
 * @param {Node} displayContainer 
 * @param {String} type 
 * @param {Array} urls 
 * @param {Object} urlData 
 */
function fillURLLengthDisplay(displayContainer, type, urls, urlData={}) {
    newDisplayChildren = [];
    for (const url of urls) {
        newDisplayChildren.push(createNewLinkTime(url, type, ((url in urlData && "duration" in urlData[url]) ? urlData[url].duration : -1)));
    }
    displayContainer.replaceChildren(...newDisplayChildren);
}

function createNewLinkTime(urlId, type, time=-1) {
    let newLinkElement = document.createElement("div");
    newLinkElement.classList = ["vod-length-in-display-line"];
    let newLinkLink = document.createElement("a");
    newLinkLink.classList = ["url-video-link"];
    newLinkLink.setAttribute("target", "_blank");
    newLinkLink.setAttribute("href", urlDict[type] + urlId);
    newLinkLink.setAttribute("data-url-type", type);
    newLinkLink.innerHTML = urlDict[type] + urlId;
    newLinkElement.appendChild(newLinkLink);
    let newLinkInput = document.createElement("input");
    newLinkInput.classList = ["url-video-time"];
    newLinkInput.id = "url-time-input-" + urlId;
    newLinkInput.setAttribute("placeholder", "--:--:--");
    newLinkInput.addEventListener("focusout", getVideoLengthsFromInput.bind(null, urlId, true)); // ("focusout", function() {getVideoLengthsFromInput(urlId)})
    if (time > 0) {
        newLinkInput.value = urlTimeFormatDict["timestamp"](time);
    }
    // newLinkInput.setAttribute("pattern", "[0-9]+:[0-9]+:[0-9]+");
    newLinkElement.appendChild(newLinkInput);
    return newLinkElement
}


// TIMESTAMP OUTPUT

function addURLArea(parentContainer, urlID, isInputPrefix, type="") {
    var newArea = document.createElement("div");
    newArea.classList = ["url-video-area"];
    newArea.setAttribute("data-url-type", type);
    let areaID = isInputPrefix + "url-video-area-" + String(urlID);
    newArea.id = areaID;
    parentContainer.appendChild(newArea);
    return areaID;
}

function addLinkToURLArea(url, type, areaID, description, time=-1, spacer=" - ") {
    let newRowElement = document.createElement("div");
    newRowElement.classList = ["url-video-row"];
    let newLinkElement = document.createElement("span");
    newLinkElement.classList = ["url-video-link"];
    newLinkElement.innerHTML = urlDict[type] + url + (type!="timestamp" ? "?t=" : "");
    let newTimeInput = document.createElement("span");
    newTimeInput.classList = ["url-video-time"];
    newTimeInput.setAttribute("contenteditable", "true");
    newTimeInput.addEventListener("paste", contenteditableSpanEventListener);
    newTimeInput.setAttribute("placeholder", "--:--:--");
    if (time >= 0) {
        newTimeInput.innerHTML = urlTimeFormatDict[type](time);
    }
    let newSpacerElement = document.createElement("span");
    newSpacerElement.classList = ["url-video-spacer"];
    newSpacerElement.innerHTML = spacer;
    let newDescriptionElement = document.createElement("span");
    newDescriptionElement.classList = ["url-video-description"];
    newDescriptionElement.setAttribute("contenteditable", "true");
    newDescriptionElement.addEventListener("paste", contenteditableSpanEventListener);
    newDescriptionElement.innerHTML = description;

    newRowElement.appendChild(newLinkElement);
    newRowElement.appendChild(newTimeInput);
    newRowElement.appendChild(newSpacerElement);
    newRowElement.appendChild(newDescriptionElement);
    document.getElementById(areaID).appendChild(newRowElement);
}


//TIMESTAMP INPUT

function readInputTimestamps() {
    if (inputTimestampURLTextarea.style.display == "" || inputTimestampURLTextarea.style.display == "block") {
        [inputTimestamps, originURLOrder, originURLType] = readTimestampURLSFromInputTextarea(inputTimestampURLTextarea);
        //getVideoLengths();
        guessVideoCorrelation();
        updateOriginURLLengthDisplay();
        //updateTimestampDisplay(); // needed here?
    }
    else {
        inputTimestampURLTextarea.style.display = "block";
        convertTimestampDisplayButton.innerHTML = ">";
        urlTargetContainer.style.display = "none";
    }
}

// Is called when new data is available
/* var inputTimestamps; // Array of origin timestamps [[originVideoId, originTimestamp, description, targetVideoId, targetTimestamp],[...]]
originURLOrder = []; // Array of origin video IDs [videoId1, videoId2, ...]
targetURLOrder = []; // Array of target video IDs [videoId1, videoId2, ...]
timestampURLDict = {}; // {"videoId": {"areaID": AreaDivId}}
originURLType = "none";
targetURLType = "none"; */
function updateTimestampDisplay(){
    if ((originURLOrder.length > 0) && (originURLType != "none") && (inputTimestamps.length > 0)) {
        inputTimestampURLTextarea.style.display = "none";
        convertTimestampDisplayButton.innerHTML = "<";
        urlTargetContainer.style.display = "grid";
        for (const delArea of urlTargetContainer.querySelectorAll("div.url-video-area")) {
            let delAreaId = delArea.id.split("url-video-area-")[1];
            if (delAreaId in timestampURLDict && "areaID" in timestampURLDict[delAreaId]) {
                delete timestampURLDict[delAreaId].areaID;
            }
        }
        urlTargetContainer.replaceChildren();
        let outputStyle = urlOutputType.split("-");
        if (outputStyle[0] == "origin") {
            for (const originURL of originURLOrder) {
                if (!(originURL in timestampURLDict)) {
                    timestampURLDict[originURL] = {}
                }
                if (!("areaID" in timestampURLDict[originURL])) {
                    timestampURLDict[originURL].areaID = addURLArea(urlTargetContainer, originURL, "originTimestamp-", originURLType);
                }
            }
            if (outputStyle[1] == "url") {
                for (const inputTimestamp of inputTimestamps) {
                    addLinkToURLArea(inputTimestamp[0], originURLType, timestampURLDict[inputTimestamp[0]].areaID, inputTimestamp[2], inputTimestamp[1]);
                }
            }
            else if (outputStyle[1] == "timestamp") {
                for (const inputTimestamp of inputTimestamps) {
                    addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[0]].areaID, inputTimestamp[2], inputTimestamp[1]);
                }
            }
        }
        else if (outputStyle[0] == "target") {
            if ((targetURLOrder.length > 0) && (targetURLType != "none")) {
                for (const targetURL of targetURLOrder) {
                    if (!(targetURL in timestampURLDict)) {
                        timestampURLDict[targetURL] = {}
                    }
                    if (!("areaID" in timestampURLDict[targetURL])) {
                        timestampURLDict[targetURL].areaID = addURLArea(urlTargetContainer, targetURL, "targetTimestamp-", targetURLType);
                    }
                }
                if (outputStyle[1] == "url") {
                    for (const inputTimestamp of inputTimestamps) {
                        addLinkToURLArea(inputTimestamp[3], targetURLType, timestampURLDict[inputTimestamp[3]].areaID, inputTimestamp[2], inputTimestamp[4]);
                    }
                }
                else if (outputStyle[1] == "timestamp") {
                    for (const inputTimestamp of inputTimestamps) {
                        addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[3]].areaID, inputTimestamp[2], inputTimestamp[4]);
                    }
                }
            }
            else { // No valid target urls entered yet
                let newMessageElement = document.createElement("span");
                newMessageElement.classList = ["url-video-message"];
                newMessageElement.innerHTML = "Please enter at least one valid target url to display the timestamps in this format!";
                urlTargetContainer.appendChild(newMessageElement);
            }
        }
    }
}

function updateOriginURLLengthDisplay(){
    if ((originURLOrder.length > 0) && (originURLType != "none")) {
        originURLLengthMessage.style.display = "none";
        originURLLengthDisplay.style.display = "grid";
        fillURLLengthDisplay(originURLLengthDisplay, originURLType, originURLOrder, timestampURLDict); // Fill origin url length display with urls from origin timestamps
    }
}

function updateTimestampTargetData(){
    if ((targetURLOrder.length > 0) && (targetURLType != "none")) {
        //TODO Timestamp stuff :)
    }
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
        if (divChildNode != targetURLLengthDiv.lastChild) {
            content += "\n";
        }
    }
    return content
}

/**
 * Get origin vod time (adds up all previous vod lengths)
 * @param {Array} timestamp [originVideoId, originTimestamp, description, targetVideoId, targetTimestamp]
 * @returns 
 */
function getWholeOriginVODTime(timestamp) {
    let totalTime = 0;
    for (let i = 0; i < originURLOrder.indexOf(timestamp[0]); i++) {
        if (twURlist[originURLOrder[i]]) {
            totalTime += twURlist[twURlistOrder[i]];
        }
    }
    return totalTime + timestamp[1]
}

function initilizeYoutubeIFrameAPI(){
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.getElementsByClassName("settings-container")[0].appendChild(tag);
}

function onYouTubeIframeAPIReady() {
    // let player = createYTPlayer("viDx9FQej7U", ytPlayerContainer);
}

function createYTPlayer(videoId, playerParentContainer) {
    let newPlayerElement = document.createElement("div");
    newPlayerElement.classList = ["yt-player"];
    newPlayerElement.id = "yt-player-"+videoId;
    playerParentContainer.appendChild(newPlayerElement);
    let player = new YT.Player("yt-player-"+videoId, {
        height: '270',
        width: '480',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady,
        }
    });
    return player
}

function onPlayerReady(event) {
    let vidId = event.target.getVideoData().video_id;
    if (!(vidId in timestampURLDict)) {
        timestampURLDict[vidId] = {}
    }
    timestampURLDict[vidId].duration = event.target.getDuration();
}




/* function updateVideoLength(videoId, videoType) {
    if (!(videoId in timestampURLDict)) {
        timestampURLDict[videoId] = {}
    }
    let inputElement = document.getElementById("url-time-input-" + videoId);
    if (unifyTime(inputElement.value)) { // Check if time was already set for this video id
        timestampURLDict[videoId].duration = unifyTime(inputElement.value);
    }
    else {
        if (videoType == "youtube") {
            if (timestampURLDict[videoId].ytPlayer === undefined) {
                //timestampURLDict[videoId].ytPlayer = createYTPlayer(videoId, ytPlayerContainer); // Check if player already exists or if duration is already known
            }
            else {
                //timestampURLDict[videoId].duration = timestampURLDict[videoId].ytPlayer.getDuration();
            }
        }
        // Maybe add twitch API call in the future
    }
} */

function setVideoLength(videoId, duration=-1, isManuallySet=false) {
    let inputElement = document.getElementById("url-time-input-" + videoId);
    if (!(videoId in timestampURLDict)) {
        timestampURLDict[videoId] = {}
    }
    if (duration > 0) {
        timestampURLDict[videoId].duration = duration;
        inputElement.value = urlTimeFormatDict["timestamp"](duration);
        timestampURLDict[videoId].durationManuallySet = manuallySet;
    }
    else {
        if (timestampURLDict[videoId].duration !== undefined) {
            inputElement.value = urlTimeFormatDict["timestamp"](timestampURLDict[videoId].duration);
        }
        else {
            inputElement.value = "";
        }
    }
}

function guessVideoCorrelation() {
    if (originURLOrder.length > 0 && targetURLOrder.length > 0) {
        if (originURLOrder.length === targetURLOrder.length) {
            for (let i = 0; i < inputTimestamps.length; i++) {
                inputTimestamps[i][4] = inputTimestamps[i][1]; // [[originVideoId, originTimestamp, description, targetVideoId, targetTimestamp],[...]]
                inputTimestamps[i][3] = targetURLOrder[originURLOrder.indexOf(inputTimestamps[i][0])];
            }
            setURLOutput('target-timestamp', false);
        }
        else if (originURLOrder.length > targetURLOrder.length) {
            getVideoLengths();
            // try to guess which one belongs to which
            /*
            schaue ob erste gleich lang sind, bzw ob origin länger ist
            wenn origin länger ist setzete zwei target auch auf origin und schau ob die gleich lang sein könnten
            schau ob imme rnoch mehr origin übrig sind als target
            prüfe ob alle timestamps in bekannte Zeiten fallen*/
        }
        else {
            window.alert("It was not implemented to guess combining multiple origin videos into one target video as it was not a use case at the time. If you would like this functionality please contact me :)");
        }
    }
}

function guessVideoDuration() {
    /*
    1. Check if manually set already
    2. Check type => YT-API
    3. Set from timestamps and try to guess
    4 Give up
    */
}

// TODO: Manual Input delete value

// Called when focusout length inputs
function getVideoLengthsFromInput(videoId, isManualInput) {
    let inputElement = document.getElementById("url-time-input-" + videoId);
    let videoDuration = unifyTime(inputElement.value);
    if (!videoDuration) { // Check if time was already set in the input for this video id
        videoDuration = -1;
    }
    setVideoLength(videoId, videoDuration, isManualInput);
    if (!isManualInput) {
        return (videoDuration > 0)
    }
}

function getVideoLengths() {
    if ((originURLOrder.length > 0) && (originURLType != "none")) { // Origin
        for (const originVideoId of originURLOrder) {
            if (!(originVideoId in timestampURLDict)) {
                timestampURLDict[originVideoId] = {}
            }
            if (timestampURLDict[originVideoId].durationManuallySet) {
                continue
            }
            else {
                if (originURLType == "youtube") {
                    if (timestampURLDict[originVideoId].ytPlayer === undefined) {
                        timestampURLDict[originVideoId].ytPlayer = createYTPlayer(originVideoId, ytPlayerContainer); // Check if player already exists or if duration is already known
                    }
                    else {
                        timestampURLDict[originVideoId].duration = timestampURLDict[originVideoId].ytPlayer.getDuration();
                    }
                }
                else { // Set length of origin videos to max of their timestamps if possible
                    timestampURLDict[originVideoId].duration = Math.max(...inputTimestamps.filter((timestamp) => (timestamp[0]==originVideoId)).map((timestamp) => (timestamp[1])),0);
                }
            }
        }
    }
    if ((targetURLOrder.length > 0) && (targetURLType != "none")) { // Target
        for (const targetVideoId of targetURLOrder) {
            if (!(targetVideoId in timestampURLDict)) {
                timestampURLDict[targetVideoId] = {}
            }
            if (timestampURLDict[targetVideoId].durationManuallySet) {
                continue
            }
            else {
                if (targetURLType == "youtube") {
                    if (timestampURLDict[targetVideoId].ytPlayer === undefined) {
                        timestampURLDict[targetVideoId].ytPlayer = createYTPlayer(targetVideoId, ytPlayerContainer); // Check if player already exists or if duration is already known
                    }
                    else {
                        timestampURLDict[targetVideoId].duration = timestampURLDict[targetVideoId].ytPlayer.getDuration();
                    }
                }
            }
        }
    }
}

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


// UNUSED
function filterDescriptionText() {
    /* if (settingsRemoveTwitchEmotesCheckbox.checked) {
                timestamps[i][2] = (timestamps[i][2].replace(/:[a-zA-Z]*:/,"")).trim();
            } */
    return null;
}

function clearInputOutput() {
    
}

function clearData() {
    inputTimestamps = [];
    originURLOrder = [];
    targetURLOrder = [];
    timestampURLDict = {};
    newURLDict = {};
    originURLType = "none";
    targetURLType = "none";
    originVideoData = {};
    urlOutputType = "target-timestamp";
}

/* window.onload = function(){
    twitchURLTable = document.getElementById("twitch-url-table");
    ytURLs = document.getElementById("yt-url");
    ytURLLinksDisplay = document.getElementById("timestamp-output-yt-url");
    ytURLTimestampsDisplay = document.getElementById("timestamp-output-yt-comment");
    twEmoteRemoveCheck = document.getElementById("settings-remove-twitch-emotes");

    settingsRemoveTwitchEmotesCheckbox.addEventListener('change', function(){
        convert_timestamps();
    });
    inputTextareaTwitchTimestamps.addEventListener('input', function(){
        convert_timestamps();
    });
} */


// FUNCTIONS
/* function convert_timestamps() {
 */
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
