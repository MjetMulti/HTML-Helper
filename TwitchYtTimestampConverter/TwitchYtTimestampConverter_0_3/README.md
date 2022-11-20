# Timestamp Converter

Converts youtube or twitch timestamps for a video to other formats and/or to account for video splitting

If you have ideas on how to make this better or find bugs please feel free to message me

## How to use?
1. Download this folder with all files inside it
2. Open 'TwitchYtTimestampConverter_0_3.html' with a browser of your choice (either double click or right click -> Open with...)
3. Choose your desired settings (can also be done later)
4. Input timestamps and target urls (depending on your settings you might also have to input some video durations; see [Calulating methods](#calculation-methods) for more info)
5. Edit the timestamps if nessesary
6. Have formatted timestamps :)

### Supported functionality
- supports Twitch and Youtube urls
- accepts timestamps with
  1. a valid url with a timestamp
  2. a description separated from the url by a space (further filters for the description can be applied later)
- the number of origin video must be equal or smaller than the number of target videos
  - origin video can be split into multiple target videos
  - currently combining timestamps from multiple origin video into one target video is not supported

### Features
- filter discord emotes (:slightsmile:)
- filter emojis (&#x1F642;)
- wrap urls in pointy brackets (to avoid embeds (in discord))
- use the Youtube-iFrame-API to automatically gather durations of youtube videos (has to be turned on mallually by disabeling "Use local mode")
- set custom spacer to separate the timestamp and the description (should start with a space to separate the url properly)
- adjust zero-timestamp for youtube chapters
  - youtube chapters require a timestamp at 0:00, at least 3 timestamps (chronologically ordered) and chapters to be at least 10s long
  - Can add a 0:00 timestamp, remove them if the timestamps should not be considered chapters or ignore this problem

### Output formats
- target or origin determins for which video urls the timestamps should be shown
- timestamps or urls determins the format of the output timestamps
    - timestamps: '00:00:00&lt;spacer&gt;\&lt;description&gt;'
    - urls: '&lt;ulr-with-timestamp&lt;spacer&gt;\&lt;description&gt;'

### Calculation methods
#### Guess video correlation
"Guesses" to which video a timestamp should be mapped

Requires:
- Origin video durations (except the last one)

Example:
- Starts with timestamps of the first origin video and maps them to the first target video
- If a origin timestamp is greater than the current target video duration it maps the timestamp (and the following ones) to the next target video
- If a timestamp from the next origin video is reached it also goes to the next target video

#### Calculate video correlation
Calculates the total time of each timestamp in the origin videos. Use if guessing doesn't work

Requires:
- Origin video durations (except the last one)
- Exact target video durations (except the last one)

Example:
- a timestamp in the 3rd origin video
- sums up the durations of origin-video 1, 2 and the timestamp => origin total time
- Is the 'origin total time' greater than the duration of the first target video?
  - No -> Timestamp is mapped to that target video with the remaining 'origin total time'
  - Yes -> Subtract the duration of that target video from the 'origin total time' and try again with the next target video
