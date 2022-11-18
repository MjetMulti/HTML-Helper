// HTML ELEMENTS
var inputTimestampURLTextarea;
var originURLLengthMessage;
var originURLLengthDisplay;

var urlTargetContainer;
var convertTimestampDisplayButton;

var urlControlButtons;
var controlButtonsSetManually = false;

var ytPlayerContainer;

var settingsRemoveDiscordEmotesCheckbox;
var settingsRemoveEmojisCheckbox;
var settingsGuessTwitchVodDuration;
var settingsShowVideoCorrelation;
var settingsUseLocalMode;

// SCRIPT VARIABLES
var inputTimestamps = []; // Array of origin timestamps [[originVideoId, originTimestamp, description, targetVideoId, targetTimestamp],[...]]
var originURLOrder = []; // Array of origin video IDs [videoId1, videoId2, ...]
var targetURLOrder = []; // Array of target video IDs [videoId1, videoId2, ...]
var timestampURLDict = {}; // Dictionary with videoId data {"videoId": {"areaID": AreaDivId}}
var newURLDict = {};
var originURLType = "none";
var targetURLType = "none";
var originVideoData = {};


var editmodeOn = false;
var urlOutputType = "target-timestamp";

var outputSpacer = " - ";
var ytAPIInit = false;

window.addEventListener('load', function() {
    // Used HTML elements
    inputTimestampURLTextarea = document.getElementById("timestamp-input-twitch-url");
    
    
    originURLLengthMessage = document.getElementById("url-length-origin-message");
    originURLLengthDisplay = document.getElementById("url-length-origin-display");
    convertTimestampDisplayButton = document.getElementById("convert-timestamp-display-button");

    urlTargetContainer = document.getElementById("url-target-container");

    urlControlButtons = document.querySelectorAll("button[data-toggle]");

    ytPlayerContainer = document.getElementById("yt-player-container");
    

    settingsRemoveDiscordEmotesCheckbox = document.getElementById("settings-remove-discord-emotes");
    settingsRemoveEmojisCheckbox = document.getElementById("settings-remove-emojis");
    settingsGuessTwitchVodDuration = document.getElementById("settings-guess-twitch-duration");
    settingsShowVideoCorrelation = document.getElementById("settings-show-video-correlation");
    settingsUseLocalMode = document.getElementById("settings-use-local-mode");
    let settingsOutputSpacer = document.getElementById("settings-output-spacer-input");
    if (settingsOutputSpacer.value === "") {
        outputSpacer = " ";
    }
    else {
        outputSpacer = settingsOutputSpacer.value;
    }

    if (!ytAPIInit && !settingsUseLocalMode.checked) {
        initilizeYoutubeIFrameAPI();
    }
    // EVENT LISTENERS

    let targetURLLengthDiv = document.getElementById("url-length-target-input");
    let targetURLLengthEditButton = targetURLLengthDiv.parentElement.querySelector('header button');
    let targetURLLengthDisplay = document.getElementById("url-length-target-display");
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


    settingsRemoveDiscordEmotesCheckbox.addEventListener("change", function(event) {
        updateTimestampDisplay();
    });
    settingsRemoveEmojisCheckbox.addEventListener("change", function(event) {
        updateTimestampDisplay();
    });
    /* settingsShowVideoCorrelation.addEventListener("change", function(event) {
        updateTimestampDisplay();
    }); */
    settingsUseLocalMode.addEventListener("change", function(event) {
        if (!ytAPIInit && !settingsUseLocalMode.checked) {
            initilizeYoutubeIFrameAPI();
        }
    });
    settingsOutputSpacer.addEventListener("focusout", function(event) {
        if (settingsOutputSpacer.value === "") {
            outputSpacer = " ";
        }
        else {
            outputSpacer = settingsOutputSpacer.value;
        }
        updateTimestampDisplay();
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
});

/**
 * Set the output type of the urls
 * @param {String} urlControl (target-timestamp|target-url|origin-timestamp|origin-url) String
 */
 function setURLOutput(urlControl, manuallySet, shouldUpdateTimestampDisplay=true) {
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
        if (shouldUpdateTimestampDisplay) {
            updateTimestampDisplay();
        }
    }
}

//TIMESTAMP INPUT

function readInputTimestamps() {
    if (inputTimestampURLTextarea.style.display == "" || inputTimestampURLTextarea.style.display == "block") {
        [inputTimestamps, originURLOrder, originURLType] = readTimestampURLSFromInputTextarea(inputTimestampURLTextarea);
        //getVideoLengths();
        updateOriginURLLengthDisplay();
        guessVideoCorrelation();
        console.log(inputTimestamps);
        //updateTimestampDisplay(); // needed here?
    }
    else {
        inputTimestampURLTextarea.style.display = "block";
        convertTimestampDisplayButton.innerHTML = ">";
        urlTargetContainer.style.display = "none";
    }
}

function initilizeYoutubeIFrameAPI(){
    ytAPIInit = true;
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.getElementsByClassName("settings-container")[0].appendChild(tag);
}

function onYouTubeIframeAPIReady() {
    console.log("Youtube iFrame-API loaded");
    // let player = createYTPlayer("viDx9FQej7U", ytPlayerContainer);
}

function createYTPlayer(videoId, playerParentContainer) {
    if (ytAPIInit && !settingsUseLocalMode.checked) {
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
    else {
        return undefined
    }
}

function onPlayerReady(event) {
    let vidId = event.target.getVideoData().video_id;
    if (!(vidId in timestampURLDict)) {
        timestampURLDict[vidId] = {}
    }
    timestampURLDict[vidId].duration = event.target.getDuration();
    setVideoLength(vidId, event.target.getDuration(), true); // Actually false but we pretend because reasons
}


function setVideoLength(videoId, duration=-1, isManuallySet=false) {
    let inputElement = document.getElementById("url-time-input-" + videoId);
    if (!(videoId in timestampURLDict)) {
        timestampURLDict[videoId] = {}
    }
    if (duration > 0) {
        timestampURLDict[videoId].duration = duration;
        inputElement.value = urlTimeFormatDict["timestamp"](duration);
        timestampURLDict[videoId].durationManuallySet = isManuallySet;
    }
    else {
        if (duration === undefined) {
            timestampURLDict[videoId].duration = undefined;
            timestampURLDict[videoId].durationManuallySet = false;
        }
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
            return true
        }
        else if (originURLOrder.length < targetURLOrder.length) {
            getVideoLengths();
            let currentOriginIdx = 0;
            let currentTargetIdx = 0;
            let targetDurationSum = 0;
            let currentTimestampIdx = 0;
            let stackedTargetDuration = 0;
            while (currentOriginIdx < originURLOrder.length) {
                if (currentTargetIdx >= targetURLOrder.length-1) { // Last target url
                    while (currentTimestampIdx < inputTimestamps.length) {
                        inputTimestamps[currentTimestampIdx][4] = inputTimestamps[currentTimestampIdx][1] - stackedTargetDuration; // -andrer vod
                        inputTimestamps[currentTimestampIdx][3] = targetURLOrder[currentTargetIdx];
                        currentTimestampIdx++;
                    }
                    break;
                }
                targetDurationSum += timestampURLDict[targetURLOrder[currentTargetIdx]].duration;
                let durationDiff = Math.abs(timestampURLDict[originURLOrder[currentOriginIdx]].duration - targetDurationSum);
                if (durationDiff < 5) {
                    while (inputTimestamps[currentTimestampIdx][0] == originURLOrder[currentOriginIdx]) {
                        inputTimestamps[currentTimestampIdx][4] = inputTimestamps[currentTimestampIdx][1] - stackedTargetDuration; // -andrer vod
                        inputTimestamps[currentTimestampIdx][3] = targetURLOrder[currentTargetIdx];
                        currentTimestampIdx++;
                    }
                    currentOriginIdx++;
                    currentTargetIdx++;
                    targetDurationSum = 0;
                    stackedTargetDuration = 0;
                }
                else {
                    while ((currentTimestampIdx < inputTimestamps.length) && (inputTimestamps[currentTimestampIdx][1] < targetDurationSum)) {
                        inputTimestamps[currentTimestampIdx][4] = inputTimestamps[currentTimestampIdx][1] - stackedTargetDuration; // -andrer vod
                        inputTimestamps[currentTimestampIdx][3] = targetURLOrder[currentTargetIdx];
                        currentTimestampIdx++;
                    }
                    if (currentTimestampIdx >= inputTimestamps.length) {
                        break;
                    }
                    stackedTargetDuration += timestampURLDict[targetURLOrder[currentTargetIdx]].duration;
                    currentTargetIdx++;
                }
            }
            setURLOutput('target-timestamp', false);
            return true
            /*
            nach hinten kann es offen sein*/
        }
        else {
            window.alert("It was not implemented to guess combining multiple origin videos into one target video as it was not a use case at the time. If you would like this functionality please contact me :)");
        }
    }
}

// Called when focusout length inputs
function getVideoLengthsFromInput(videoId, isManualInput) {
    let inputElement = document.getElementById("url-time-input-" + videoId);
    if (isManualInput && inputElement.value === "") {
        setVideoLength(videoId, undefined, isManualInput);
    }
    else {
        let videoDuration = unifyTime(inputElement.value);
        if (!videoDuration) { // Check if time was already set in the input for this video id
            videoDuration = -1;
        }
        setVideoLength(videoId, videoDuration, isManualInput);
        if (!isManualInput) {
            return (videoDuration > 0)
        }
    }
}

/*
    1. Check if manually set already
    2. Check type => YT-API
    3. Set from timestamps and try to guess
    4 Give up
    */
function getVideoLengths() {
    if ((originURLOrder.length > 0) && (originURLType != "none")) { // Origin
        for (const originVideoId of originURLOrder) {
            updateVideoLength(originVideoId, originURLType, "origin");
        }
        setURLOutput('origin-timestamp', false, false);
    }
    if ((targetURLOrder.length > 0) && (targetURLType != "none")) { // Target
        for (const targetVideoId of targetURLOrder) {
            updateVideoLength(targetVideoId, targetURLType, "target");
        }
        setURLOutput('target-timestamp', false, false);
    }
}

function updateVideoLength(videoId, videoType, urlType) {
    if (!(videoId in timestampURLDict)) {
        timestampURLDict[videoId] = {}
    }
    if (timestampURLDict[videoId].durationManuallySet) {
        return true
    }
    else {
        if (videoType == "youtube" && !settingsUseLocalMode.checked) {
            if (timestampURLDict[videoId].ytPlayer === undefined) {
                timestampURLDict[videoId].ytPlayer = createYTPlayer(videoId, ytPlayerContainer); // Check if player already exists or if duration is already known
            }
            else {
                timestampURLDict[videoId].duration = timestampURLDict[videoId].ytPlayer.getDuration();
                setVideoLength(videoId, timestampURLDict[videoId].duration, false);
            }
        }
        else if (urlType === "origin") { // Set length of origin videos to max of their timestamps if possible
            timestampURLDict[videoId].duration = Math.max(...inputTimestamps.filter((timestamp) => (timestamp[0]==videoId)).map((timestamp) => (timestamp[1])),0);
            setVideoLength(videoId, timestampURLDict[videoId].duration, false);
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
                    addLinkToURLArea(inputTimestamp[0], originURLType, timestampURLDict[inputTimestamp[0]].areaID, filterDescriptionText(inputTimestamp[2]), inputTimestamp[1], outputSpacer);
                }
            }
            else if (outputStyle[1] == "timestamp") {
                for (const inputTimestamp of inputTimestamps) {
                    addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[0]].areaID, filterDescriptionText(inputTimestamp[2]), inputTimestamp[1], outputSpacer);
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
                        addLinkToURLArea(inputTimestamp[3], targetURLType, timestampURLDict[inputTimestamp[3]].areaID, filterDescriptionText(inputTimestamp[2]), inputTimestamp[4], outputSpacer);
                    }
                }
                else if (outputStyle[1] == "timestamp") {
                    for (const inputTimestamp of inputTimestamps) {
                        addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[3]].areaID, filterDescriptionText(inputTimestamp[2]), inputTimestamp[4], outputSpacer);
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
        if (!(url in timestampURLDict)) {
            timestampURLDict[url] = {}
        }
        if ((type==="youtube") && !settingsUseLocalMode.checked && (timestampURLDict[url].ytPlayer === undefined)) {
            timestampURLDict[url].ytPlayer = createYTPlayer(url, ytPlayerContainer); // Check if player already exists or if duration is already known
        }
    }
    displayContainer.replaceChildren(...newDisplayChildren);
}

/**
 * Adds an url + duration row to an url-length-display
 * @param {String} urlId ID of the video
 * @param {String} type Type of the video (twitch|youtube)
 * @param {Number} time Duration of the video (in seconds)
 * @returns {Node} Row-element with url link and duration input
 */
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
    newLinkElement.appendChild(newLinkInput);
    return newLinkElement
}

/**
 * Update the display of the origin video urls
 */
function updateOriginURLLengthDisplay(){
    if ((originURLOrder.length > 0) && (originURLType != "none")) {
        originURLLengthMessage.style.display = "none";
        originURLLengthDisplay.style.display = "grid";
        fillURLLengthDisplay(originURLLengthDisplay, originURLType, originURLOrder, timestampURLDict); // Fill origin url length display with urls from origin timestamps
    }
}

/**
 * Filters (description) text depending on settings
 * @param {String} text Text that should be filtered
 * @returns Filtered text
 */
function filterDescriptionText(text) {
    let hilf = text;
    if (settingsRemoveDiscordEmotesCheckbox.checked) {
        hilf = (hilf.replace(/:[a-zA-Z]*:/,"")).trim();
    }
    if (settingsRemoveEmojisCheckbox.checked) {
        hilf = (hilf.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g,"")).trim(); //TODO: check unicode tables to verify these
    }
    return hilf
}





// UNUSED
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

function updateTimestampTargetData(){
    if ((targetURLOrder.length > 0) && (targetURLType != "none")) {
        //TODO Timestamp stuff :)
    }
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
STREAM RECAP 10/21/22

https://www.twitch.tv/videos/1630353296?t=0s - waking up and talking to Odessa about the HWM and Norman Bones :rBeeCrowHug:
https://www.twitch.tv/videos/1630353296?t=3401s - getting on duty :amrainEMS:
https://www.twitch.tv/videos/1630353296?t=3632s - finding out that John Doe perma :curvyeTea:
https://www.twitch.tv/videos/1630353296?t=7470s Finding out that Storm is engaged and her recent trauma she encountered ⚠️Torture details ⚠️ :rBeeShocked:
https://www.twitch.tv/videos/1630353296?t=8310s - talking to Sean about the pitcher’s event tonight :amrainGayPride:
https://www.twitch.tv/videos/1630353296?t=9650s - waking up after storm and showing chat Kiki’s spoopy home :rBeeHug:
https://www.twitch.tv/videos/1630353296?t=9651s - phone from Ali asking Kiki if she help with DOC training :amrainPhone:
https://www.twitch.tv/videos/1630353296?t=11201s - chilling at Viceroy :amrainCozywebs:
https://www.twitch.tv/videos/1630353296?t=11950s - getting on duty :rBEEMS:
https://www.twitch.tv/videos/1630353296?t=13511s - ⚠️do not watch if you have a phobia with needles ⚠️
https://www.twitch.tv/videos/1630353296?t=13726s - needle talk is done, Kiki going back to chilling at Vicroy :rBEEMS:
https://www.twitch.tv/videos/1630353296?t=16290s - Kiki riding a shotaro, Kiki’s dream bike. 🏍️
https://www.twitch.tv/videos/1630353296?t=17961s - call from Bryce to catch up :rBeePhone:
https://www.twitch.tv/videos/1630353296?t=18951s Twitter is hacked or did Kiki actually ocean dumped herself? :amrainHmm:
https://www.twitch.tv/videos/1630353296?t=19997s - buying a Tulip for Shirley :nakkiWoaw: 
https://www.twitch.tv/videos/1630353296?t=23122s - Odessa calling sounding sad and wanted a hug from Kiki :amrainSadge: :rBeeHuggies:
https://www.twitch.tv/videos/1630353296?t=24800s hanging out with Bryce, Jeffy, and Giles joins later :rBeeHuggies: :rBeeCheer:
https://www.twitch.tv/videos/1630353296?t=26751s - getting back on duty to get ready for the Pitcher’s event :rBEEMS:
https://www.twitch.tv/videos/1630353296?t=27361s - getting ready for Pitcher’s Event :curvyeBobblePride: 
🌈the_ashfrog🌈 — 22/10/2022
https://www.twitch.tv/videos/1630353296?t=8h19m49s - event starts stabby stabby time :rBeeDerpKnife:
https://www.twitch.tv/videos/1630353296?t=9h34m7s - going off duty to help with a trick-or-treat event :rBeehappy:
https://www.twitch.tv/videos/1630353296?t=10h8m35s - watching the costume contest :rBeeLUL:
https://www.twitch.tv/videos/1630353296?t=10h32m14s - sending Tessa a pickup line and literally diesofcringe :rBeeRIP:
https://www.twitch.tv/videos/1630353296?t=10h43m51s - attending HOA court :rBeeHmmm:  ⚠️ loud at times⚠️
https://www.twitch.tv/videos/1630353296?t=12h39m56s - giving the doctors then the James lollipops :rBeeLUL:
https://www.twitch.tv/videos/1630353296?t=12h53m14s - getting on duty :rBEEMS:
https://www.twitch.tv/videos/1630353296?t=13h9m13s - taking the Tim skip in the firetruck then going to the ramp in Mirror Park :rBeeWicked:
https://www.twitch.tv/videos/1630353296?t=13h43m33s - Pillbot 14A again :rBeeHmmm:
https://www.twitch.tv/videos/1630353296?t=14h1m36s - Happy is way too innocent :rBeeKEKW:
 */

/* 
Vods for 10/21 on YT
https://youtu.be/G-F2PWKCqfE pt1
https://youtu.be/4ZehzsHIfSo pt2 
*/
