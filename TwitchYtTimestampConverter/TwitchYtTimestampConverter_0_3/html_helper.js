/*
EVENT LISTENERS
*/

window.addEventListener('load', function() {
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
});

function contenteditableSpanEventListener(event) {
    event.preventDefault();
    let unformattedText = e.clipboardData.getData("text/plain");
    // document.execCommand("insertText", false, unformattedText);
    document.execCommand("insertHTML", false, unformattedText);
}

/*
HTML CREATION
*/

/**
 * Creates an area-div that represents a videoId and can contain timestamp elements
 * @param {Node} parentContainer Container the areas should be added to
 * @param {String} urlID ID of the video that the area should represent
 * @param {String} isInputPrefix Prefix for the id of the area
 * @param {String} type Type of the area (influences appearence) (twitch|youtube|custom|)
 * @returns {String} The id of the created area element
 */
function addURLArea(parentContainer, urlID, isInputPrefix, type="", color="") {
    var newArea = document.createElement("div");
    newArea.classList = ["url-video-area"];
    newArea.setAttribute("data-url-type", type);
    newArea.setAttribute("data-custom-color", color);
    let areaID = isInputPrefix + "url-video-area-" + String(urlID);
    newArea.id = areaID;
    parentContainer.appendChild(newArea);
    return areaID;
}

/**
 * Creates a timestamp element and adds it to a timestamp area
 * @param {String} url Video-ID
 * @param {String} type Type of the video (twitch|youtube|timestamp)
 * @param {String} areaID ID of the area the new timestamp element should be added to
 * @param {String} description Description of the timestamp
 * @param {Number} time Timestamp (in seconds)
 * @param {String} spacer Spacer that is put between the timestamp and the description
 */
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

/**
 * Add all attributes required to color correlating areas the same color
 * @param {String} areaID ID of area that should be changed
 * @param {Number} color HSL 'H' value of the color that should be used
 * @param {String} type (twitch|youtube|custom)
 */
 function addAreaURLCorellationColor(areaID, color, type="") {
    let area = document.getElementById(areaID);
    area.setAttribute("data-url-type", type);
    area.setAttribute("data-custom-color", color);
}
