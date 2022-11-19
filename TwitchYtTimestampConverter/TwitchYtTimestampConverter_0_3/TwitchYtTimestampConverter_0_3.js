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
var settingsZeroTimestamp;

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
    settingsZeroTimestamp = document.querySelector('input[name="settings-zero-timestamp"]:checked').value;
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
            getVideoLengths();
            if (originURLOrder.length > 0 && targetURLOrder.length > 0 && originURLOrder.length === targetURLOrder.length) {
                guessVideoCorrelation();
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
    let settingsZeroTimestamps = document.querySelectorAll('input[name="settings-zero-timestamp"]');
    for (const settingsOption of settingsZeroTimestamps) {
        settingsOption.addEventListener("change", function(event) {
            if (event.target.checked) {
                settingsZeroTimestamp = event.target.value;
                updateTimestampDisplay();
            }
        });
    }
});

//TIMESTAMP INPUT

function readInputTimestamps() {
    if (inputTimestampURLTextarea.style.display == "" || inputTimestampURLTextarea.style.display == "block") {
        [inputTimestamps, originURLOrder, originURLType] = readTimestampURLSFromInputTextarea(inputTimestampURLTextarea);
        updateOriginURLLengthDisplay();
        getVideoLengths();
        if (originURLOrder.length > 0 && targetURLOrder.length > 0 && (originURLOrder.length === targetURLOrder.length || enoughDurationTimes(targetURLOrder))) {
            guessVideoCorrelation();
        }
        else {
            updateTimestampDisplay();
        }
    }
    else {
        inputTimestampURLTextarea.style.display = "block";
        convertTimestampDisplayButton.innerHTML = ">";
        urlTargetContainer.style.display = "none";
    }
}

/**
 * Guesses video correlation
 * Assumes origin videos can be split up into multiple target videos, but oen target video can NOT have multiple origin videos
 * @returns {Boolean} True if completed successfully
 */
function guessVideoCorrelation() {
    if (originURLOrder.length > 0 && targetURLOrder.length > 0) {
        let currentOriginIdx = 0;
        let currentTargetIdx = 0;
        let targetDurationSum = 0;
        let currentTimestampIdx = 0;
        let stackedTargetDuration = 0;

        while (currentOriginIdx < originURLOrder.length) {
            if (originURLOrder.slice(currentOriginIdx).length === targetURLOrder.slice(currentTargetIdx).length) { // Assume 1 to 1 correlation
                while ((currentTimestampIdx < inputTimestamps.length) && (inputTimestamps[currentTimestampIdx][0] == originURLOrder[currentOriginIdx])) {
                    inputTimestamps[currentTimestampIdx][4] = inputTimestamps[currentTimestampIdx][1] - stackedTargetDuration;
                    inputTimestamps[currentTimestampIdx][3] = targetURLOrder[currentTargetIdx];
                    currentTimestampIdx++;
                }
                currentOriginIdx++;
                currentTargetIdx++;
                targetDurationSum = 0;
                stackedTargetDuration = 0;
            }
            else if (originURLOrder.length < targetURLOrder.length) {
                targetDurationSum += timestampURLDict[targetURLOrder[currentTargetIdx]].duration;
                while ((currentTimestampIdx < inputTimestamps.length) && (inputTimestamps[currentTimestampIdx][0] == originURLOrder[currentOriginIdx]) && (inputTimestamps[currentTimestampIdx][1] <= targetDurationSum)) {
                    inputTimestamps[currentTimestampIdx][4] = inputTimestamps[currentTimestampIdx][1] - stackedTargetDuration; // -andrer vod
                    inputTimestamps[currentTimestampIdx][3] = targetURLOrder[currentTargetIdx];
                    currentTimestampIdx++;
                }
                if (currentTimestampIdx >= inputTimestamps.length) {
                    break;
                }
                else if (inputTimestamps[currentTimestampIdx][0] != originURLOrder[currentOriginIdx]) {
                    currentOriginIdx++;
                    currentTargetIdx++;
                    targetDurationSum = 0;
                    stackedTargetDuration = 0;
                }
                else if (inputTimestamps[currentTimestampIdx][1] > targetDurationSum) {
                    stackedTargetDuration += timestampURLDict[targetURLOrder[currentTargetIdx]].duration;
                    currentTargetIdx++;
                }
            }
        }
        setURLOutput('target-timestamp', false);
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

/**
 * Called when the timestamp display should be updated with changes that change bigger parts of it
 */
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
        let currentVidId = "";
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
                    if ((settingsZeroTimestamp === "add") && (currentVidId != inputTimestamp[0])) {
                        currentVidId = inputTimestamp[0];
                        if (inputTimestamp[1] != 0) {
                            addLinkToURLArea(inputTimestamp[0], originURLType, timestampURLDict[inputTimestamp[0]].areaID, "beginning of the video", 0, outputSpacer);
                        }
                    }
                    addLinkToURLArea(inputTimestamp[0], originURLType, timestampURLDict[inputTimestamp[0]].areaID, filterDescriptionText(inputTimestamp[2]), ((settingsZeroTimestamp === "remove" && inputTimestamp[1] == 0) ? 1 : inputTimestamp[1]), outputSpacer);
                }
            }
            else if (outputStyle[1] == "timestamp") {
                for (const inputTimestamp of inputTimestamps) {
                    if ((settingsZeroTimestamp === "add") && (currentVidId != inputTimestamp[0])) {
                        currentVidId = inputTimestamp[0];
                        if (inputTimestamp[1] != 0) {
                            addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[0]].areaID, "beginning of the video", 0, outputSpacer);
                        }
                    }
                    addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[0]].areaID, filterDescriptionText(inputTimestamp[2]), ((settingsZeroTimestamp === "remove" && inputTimestamp[1] == 0) ? 1 : inputTimestamp[1]), outputSpacer);
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
                        if ((settingsZeroTimestamp === "add") && (currentVidId != inputTimestamp[0])) {
                            currentVidId = inputTimestamp[3];
                            if (inputTimestamp[4] != 0) {
                                addLinkToURLArea(inputTimestamp[3], targetURLType, timestampURLDict[inputTimestamp[3]].areaID, "beginning of the video", 0, outputSpacer);
                            }
                        }
                        addLinkToURLArea(inputTimestamp[3], targetURLType, timestampURLDict[inputTimestamp[3]].areaID, filterDescriptionText(inputTimestamp[2]), ((settingsZeroTimestamp === "remove" && inputTimestamp[4] == 0) ? 1 : inputTimestamp[4]), outputSpacer);
                    }
                }
                else if (outputStyle[1] == "timestamp") {
                    for (const inputTimestamp of inputTimestamps) {
                        if ((settingsZeroTimestamp === "add") && (currentVidId != inputTimestamp[3])) {
                            currentVidId = inputTimestamp[3];
                            if (inputTimestamp[4] != 0) {
                                addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[3]].areaID, "beginning of the video", 0, outputSpacer);
                            }
                        }
                        addLinkToURLArea("", "timestamp", timestampURLDict[inputTimestamp[3]].areaID, filterDescriptionText(inputTimestamp[2]), ((settingsZeroTimestamp === "remove" && inputTimestamp[4] == 0) ? 1 : inputTimestamp[4]), outputSpacer);
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

/*
TIMESTAMP OUTPUT
*/

/**
 * Sets the style of the output display
 * @param {String} urlControl (target-timestamp|target-url|origin-timestamp|origin-url)
 * @param {Boolean} manuallySet Is the function called by a user input?
 * @param {Boolean} shouldUpdateTimestampDisplay Should the timestamp display be updated after the output style is changed?
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

/*
URL LENGTH
*/

/**
 * Called when users enter video durations
 * @param {String} videoId ID of the video
 * @param {Boolean} isManualInput Is the function called by a user input?
 * @returns {Boolean} Only returned if called by another function
 */
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
        else {
            if (enoughDurationTimes(targetURLOrder)) {
                guessVideoCorrelation();
            }
        }
    }
}

/**
 * Sets video durations in url data and then the formatted verion in the corresponding input field
 * @param {String} videoId ID of the video
 * @param {Number} duration duration of the video (in seconds)
 * @param {Boolean} isManuallySet Was the new duration input by a user? (or by another function)
 */
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

/**
 * Tries to fetch durations for all available video urls and store them
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
        if (enoughDurationTimes(targetURLOrder)) {
            setURLOutput('target-timestamp', false, false);
        }
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
            /* else {
                timestampURLDict[videoId].duration = timestampURLDict[videoId].ytPlayer.getDuration();
                setVideoLength(videoId, timestampURLDict[videoId].duration, false);
            } */
        }
        else if (urlType === "origin") { // Set length of origin videos to max of their timestamps if possible
            timestampURLDict[videoId].duration = Math.max(...inputTimestamps.filter((timestamp) => (timestamp[0]==videoId)).map((timestamp) => (timestamp[1])),0);
            setVideoLength(videoId, timestampURLDict[videoId].duration, false);
        }
    }
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
 * 
 * @param {Node} displayContainer 
 * @param {String} type 
 * @param {Array} urls 
 * @param {Object} urlData 
 */
 function fillURLLengthDisplay(displayContainer, type, urls, urlData={}) {
    newDisplayChildren = [];
    for (const url of urls) {
        newDisplayChildren.push(createNewLinkTime(url, type, type, ((url in urlData && "duration" in urlData[url]) ? urlData[url].duration : -1)));
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
function createNewLinkTime(urlId, type, visualType, time=-1) {
    let newLinkElement = document.createElement("div");
    newLinkElement.classList = ["vod-length-in-display-line"];
    let newLinkLink = document.createElement("a");
    newLinkLink.classList = ["url-video-link"];
    newLinkLink.setAttribute("target", "_blank");
    newLinkLink.setAttribute("href", urlDict[type] + urlId);
    newLinkLink.setAttribute("data-url-type", visualType);
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

/*
YOUTUBE iFrame-API
*/

/**
 * Initilize the Youtube-iFrame-API
 */
 function initilizeYoutubeIFrameAPI(){
    ytAPIInit = true;
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.getElementsByClassName("settings-container")[0].appendChild(tag);
}
// Called when the API is loaded
function onYouTubeIframeAPIReady() {
    console.log("Youtube iFrame-API loaded");
}

/**
 * Creates an youtube player for a given video id
 * @param {String} videoId ID of the video that is used to create the player
 * @param {Node} playerParentContainer Container the player is attached to
 * @returns {YT-Player} created youtube-player or undefined
 */
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

/**
 * Eventlistener for created youtube players that stores the youtube video duration for that video id
 * @param {Event} event onPlayerReady event
 */
function onPlayerReady(event) {
    let vidId = event.target.getVideoData().video_id;
    if (!(vidId in timestampURLDict)) {
        timestampURLDict[vidId] = {}
    }
    timestampURLDict[vidId].duration = event.target.getDuration();
    setVideoLength(vidId, event.target.getDuration(), true); // Actually false but we pretend because reasons
}

/* 
UTILITY FUNCTIONS
*/

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

/**
 * Checks if there are enough video durations given to process all timestamps
 * @param {Array} timeList List of video ids
 * @returns {Boolean} boolean of "Are there enough durations given to process all timestamps?"
 */
function enoughDurationTimes(timeList) {
    for (let i = 0; i < timeList.length-1; i++) {
        enoughTimes = false;
        if (timestampURLDict[timeList[i]].duration === undefined || timestampURLDict[timeList[i]].duration <= 0){
            break;
        }
        else {
            enoughTimes = true;
        }
    }
    return enoughTimes
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
