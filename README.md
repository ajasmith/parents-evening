# Parent's Evening Session Clock

A configurable browser-based session clock for parents' evenings. It displays
the current session start time, plays a bell as sessions change, and includes
fullscreen and screen wake-lock support.

## Live site

[Open the Parent's Evening Session Clock](https://ajasmith.github.io/parents-evening/)

## Configuration

Use the settings button on the page, or provide these optional query parameters:

| Parameter | Description | Default |
| --- | --- | --- |
| `title` | Page heading | `Parents Evening` |
| `logo` | HTTP or HTTPS URL for an image above the title | None |
| `invertLogo` | Set to `true` to render the logo in white | `false` |
| `start` | First session start in four-digit 24-hour time | `1600` |
| `end` | Final session end in four-digit 24-hour time | `1930` |
| `duration` | Session duration in whole minutes | `5` |

Example:

<https://ajasmith.github.io/parents-evening/?title=Year+8+Parents%27+Evening&start=1800&end=2000&duration=5>

The bell is enabled by default. Browser autoplay policies may require an
interaction with the page before audio can play.
